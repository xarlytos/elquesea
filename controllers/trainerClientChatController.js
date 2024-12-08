const TrainerClientChat = require('../models/TrainerClientChat');
const Message = require('../models/Message');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');

// Iniciar o obtener chat
exports.iniciarObtenerChat = async (req, res) => {
    console.log('🚀 Iniciando/Obteniendo chat...');
    console.log('📝 Datos recibidos:', {
        clienteId: req.params.clienteId,
        trainerId: req.user.id
    });

    try {
        const { clienteId } = req.params;
        const trainerId = req.user.id;

        // Verificar que el cliente existe y pertenece al trainer
        console.log('🔍 Verificando cliente...');
        const cliente = await Client.findOne({ _id: clienteId, trainer: trainerId });
        if (!cliente) {
            console.log('❌ Cliente no encontrado o no pertenece al trainer');
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }
        console.log('✅ Cliente verificado:', cliente.nombre);

        // Buscar chat existente o crear uno nuevo
        console.log('🔄 Buscando o creando chat...');
        let chat = await TrainerClientChat.findOneAndUpdate(
            { trainer: trainerId, cliente: clienteId },
            { $setOnInsert: { trainer: trainerId, cliente: clienteId } },
            { 
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        // Poblar información necesaria
        console.log('📥 Poblando información del chat...');
        await chat.populate([
            { path: 'trainer', select: 'nombre email' },
            { path: 'cliente', select: 'nombre email' },
            { path: 'ultimoMensaje' }
        ]);

        console.log('✅ Chat inicializado exitosamente:', {
            chatId: chat._id,
            trainer: chat.trainer.nombre,
            cliente: chat.cliente.nombre
        });

        res.json(chat);
    } catch (error) {
        console.error('❌ Error al iniciar/obtener chat:', error);
        if (error.code === 11000) {
            console.log('⚠️ Error de duplicado, intentando recuperar chat existente...');
            try {
                const chat = await TrainerClientChat.findOne({ trainer: trainerId, cliente: clienteId })
                    .populate([
                        { path: 'trainer', select: 'nombre email' },
                        { path: 'cliente', select: 'nombre email' },
                        { path: 'ultimoMensaje' }
                    ]);
                console.log('✅ Chat existente recuperado');
                return res.json(chat);
            } catch (secondError) {
                console.error('❌ Error al recuperar chat existente:', secondError);
                return res.status(500).json({ mensaje: 'Error al recuperar el chat existente' });
            }
        }
        res.status(500).json({ mensaje: 'Error al iniciar/obtener el chat' });
    }
};

// Obtener chat específico por ID
exports.obtenerChatPorId = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        console.log('🔍 Buscando chat por ID:', chatId);
        console.log('👤 Usuario solicitante:', userId);

        // Buscar el chat y verificar permisos
        const chat = await TrainerClientChat.findById(chatId)
            .populate('trainer', 'nombre email')
            .populate('cliente', 'nombre email')
            .populate('ultimoMensaje');

        if (!chat) {
            console.log('❌ Chat no encontrado');
            return res.status(404).json({ mensaje: 'Chat no encontrado' });
        }

        console.log('✅ Chat encontrado:', {
            chatId: chat._id,
            trainer: chat.trainer?.nombre,
            cliente: chat.cliente?.nombre
        });

        // Verificar que el usuario es parte del chat
        if (chat.trainer._id.toString() !== userId && chat.cliente._id.toString() !== userId) {
            console.log('❌ Usuario no autorizado');
            return res.status(403).json({ mensaje: 'No tienes permiso para ver este chat' });
        }

        console.log('✅ Usuario autorizado');

        // Obtener los últimos 50 mensajes del chat
        console.log('📥 Obteniendo mensajes del chat...');
        const mensajes = await Message.find({ conversacion: chatId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('emisor', 'nombre email')
            .populate('receptor', 'nombre email');

        console.log(`✅ ${mensajes.length} mensajes obtenidos`);

        res.json({
            chat,
            mensajes: mensajes.reverse() // Revertir para mostrar en orden cronológico
        });
    } catch (error) {
        console.error('❌ Error al obtener chat por ID:', error);
        res.status(500).json({ mensaje: 'Error al obtener el chat', error: error.message });
    }
};

// Obtener todos los chats de un trainer
exports.obtenerChatsTrainer = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        // Verificar que el trainer existe
        const trainer = await Trainer.findById(trainerId);
        if (!trainer) {
            return res.status(404).json({ mensaje: 'Trainer no encontrado' });
        }

        const chats = await TrainerClientChat.find({ trainer: trainerId })
            .sort({ fechaUltimoMensaje: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('cliente', 'nombre email')
            .populate('ultimoMensaje');

        // Obtener conteo de mensajes no leídos para cada chat
        const chatsConMensajesNoLeidos = await Promise.all(chats.map(async (chat) => {
            const mensajesNoLeidos = await chat.getMensajesNoLeidos(trainerId);
            return {
                ...chat.toObject(),
                mensajesNoLeidos
            };
        }));

        res.json(chatsConMensajesNoLeidos);
    } catch (error) {
        console.error('Error al obtener chats:', error);
        res.status(500).json({ mensaje: 'Error al obtener los chats' });
    }
};

// Obtener todos los chats de un cliente
exports.obtenerChatsCliente = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        // Verificar que el cliente existe
        const cliente = await Client.findById(clienteId);
        if (!cliente) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        const chats = await TrainerClientChat.find({ cliente: clienteId })
            .sort({ fechaUltimoMensaje: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('trainer', 'nombre email')
            .populate('ultimoMensaje');

        // Obtener conteo de mensajes no leídos para cada chat
        const chatsConMensajesNoLeidos = await Promise.all(chats.map(async (chat) => {
            const mensajesNoLeidos = await chat.getMensajesNoLeidos(clienteId);
            return {
                ...chat.toObject(),
                mensajesNoLeidos
            };
        }));

        res.json(chatsConMensajesNoLeidos);
    } catch (error) {
        console.error('Error al obtener chats:', error);
        res.status(500).json({ mensaje: 'Error al obtener los chats' });
    }
};

// Archivar chat
exports.archivarChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await TrainerClientChat.findOne({
            _id: chatId,
            $or: [
                { trainer: userId },
                { cliente: userId }
            ]
        });

        if (!chat) {
            return res.status(404).json({ mensaje: 'Chat no encontrado' });
        }

        chat.estado = 'archivado';
        await chat.save();

        res.json({ mensaje: 'Chat archivado correctamente' });
    } catch (error) {
        console.error('Error al archivar chat:', error);
        res.status(500).json({ mensaje: 'Error al archivar el chat' });
    }
};

// Obtener estadísticas del chat
exports.obtenerEstadisticasChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await TrainerClientChat.findOne({
            _id: chatId,
            $or: [
                { trainer: userId },
                { cliente: userId }
            ]
        });

        if (!chat) {
            return res.status(404).json({ mensaje: 'Chat no encontrado' });
        }

        const totalMensajes = await Message.countDocuments({ conversacion: chatId });
        const mensajesNoLeidos = await Message.countDocuments({
            conversacion: chatId,
            receptor: userId,
            leido: false
        });
        const primerMensaje = await Message.findOne({ conversacion: chatId })
            .sort({ fechaEnvio: 1 })
            .select('fechaEnvio');

        res.json({
            totalMensajes,
            mensajesNoLeidos,
            fechaInicio: primerMensaje ? primerMensaje.fechaEnvio : chat.createdAt,
            estado: chat.estado
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las estadísticas del chat' });
    }
};
