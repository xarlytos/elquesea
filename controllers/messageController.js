const Message = require('../models/Message');
const TrainerClientChat = require('../models/TrainerClientChat');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');

// Enviar un mensaje
exports.enviarMensaje = async (req, res) => {
    console.log(' Iniciando envío de mensaje...');
    const conversacionId = req.params.chatId;
    console.log(' Datos del mensaje:', {
        conversacionId,
        emisorId: req.user.id,
        tipo: req.body.tipo || 'texto',
        contenido: req.body.contenido
    });

    try {
        const { contenido, tipo = 'texto', urlArchivo = null } = req.body;
        const emisorId = req.user.id;

        // Verificar que la conversación existe
        console.log(' Verificando conversación...');
        const chat = await TrainerClientChat.findById(conversacionId)
            .populate('trainer', 'nombre email')
            .populate('cliente', 'nombre email');

        if (!chat) {
            console.log(' Conversación no encontrada');
            return res.status(404).json({ mensaje: 'Conversación no encontrada' });
        }
        console.log(' Conversación encontrada:', {
            chatId: chat._id,
            trainer: chat.trainer.nombre,
            cliente: chat.cliente.nombre
        });

        // Verificar que el emisor es parte de la conversación
        console.log(' Verificando permisos del emisor...');
        const esTrainer = chat.trainer._id.toString() === emisorId;
        const esCliente = chat.cliente._id.toString() === emisorId;
        
        if (!esTrainer && !esCliente) {
            console.log(' Usuario sin permisos para enviar mensajes');
            return res.status(403).json({ mensaje: 'No tienes permiso para enviar mensajes' });
        }
        console.log(' Permisos verificados:', esTrainer ? 'Trainer' : 'Cliente');

        // Determinar el receptor y los modelos
        let receptor, emisorModel, receptorModel;
        if (esTrainer) {
            receptor = chat.cliente._id;
            emisorModel = 'Trainer';
            receptorModel = 'Client';
            console.log(' Receptor identificado como Cliente');
        } else {
            receptor = chat.trainer._id;
            emisorModel = 'Client';
            receptorModel = 'Trainer';
            console.log(' Receptor identificado como Trainer');
        }

        console.log(' Guardando mensaje...');
        const mensaje = new Message({
            conversacion: conversacionId,
            emisor: emisorId,
            emisorModel,
            receptor,
            receptorModel,
            contenido,
            tipo,
            urlArchivo
        });

        await mensaje.save();
        console.log(' Mensaje guardado exitosamente:', {
            mensajeId: mensaje._id,
            contenido: mensaje.contenido
        });

        // Actualizar la conversación
        console.log(' Actualizando información de la conversación...');
        chat.ultimoMensaje = mensaje._id;
        chat.fechaUltimoMensaje = new Date();
        await chat.save();
        console.log(' Conversación actualizada');

        // Poblar información del emisor y receptor
        await mensaje.populate([
            { path: 'emisor', select: 'nombre email' },
            { path: 'receptor', select: 'nombre email' }
        ]);
        
        console.log(' Mensaje enviado exitosamente');

        res.status(201).json(mensaje);
    } catch (error) {
        console.error(' Error al enviar mensaje:', error);
        res.status(500).json({ mensaje: 'Error al enviar el mensaje' });
    }
};

// Obtener mensajes de una conversación
exports.obtenerMensajes = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user.id;

        console.log(' Obteniendo mensajes del chat:', chatId);

        // Verificar que el usuario tiene acceso a la conversación
        const chat = await TrainerClientChat.findById(chatId);

        if (!chat) {
            console.log(' Chat no encontrado');
            return res.status(404).json({ mensaje: 'Chat no encontrado' });
        }

        // Verificar que el usuario es parte del chat
        if (chat.trainer.toString() !== userId && chat.cliente.toString() !== userId) {
            console.log(' Usuario no autorizado');
            return res.status(403).json({ mensaje: 'No tienes permiso para ver este chat' });
        }

        console.log(' Usuario autorizado');

        const mensajes = await Message.find({ conversacion: chatId })
            .sort({ fechaEnvio: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('emisor', 'nombre email')
            .populate('receptor', 'nombre email');

        console.log(` ${mensajes.length} mensajes obtenidos`);

        // Marcar mensajes como leídos
        await Message.updateMany(
            {
                conversacion: chatId,
                receptor: userId,
                leido: false
            },
            { leido: true }
        );

        console.log(' Mensajes marcados como leídos');

        res.json(mensajes);
    } catch (error) {
        console.error(' Error al obtener mensajes:', error);
        res.status(500).json({ mensaje: 'Error al obtener los mensajes' });
    }
};

// Marcar mensaje como leído
exports.marcarComoLeido = async (req, res) => {
    try {
        const { mensajeId } = req.params;
        const userId = req.user.id;

        const mensaje = await Message.findOne({
            _id: mensajeId,
            receptor: userId
        });

        if (!mensaje) {
            return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
        }

        mensaje.leido = true;
        await mensaje.save();

        res.json({ mensaje: 'Mensaje marcado como leído' });
    } catch (error) {
        console.error('Error al marcar mensaje como leído:', error);
        res.status(500).json({ mensaje: 'Error al marcar el mensaje como leído' });
    }
};

// Obtener mensajes no leídos
exports.obtenerMensajesNoLeidos = async (req, res) => {
    try {
        const userId = req.user.id;

        const mensajesNoLeidos = await Message.find({
            receptor: userId,
            leido: false
        })
        .populate('emisor', 'nombre email')
        .populate('conversacion');

        res.json({
            cantidad: mensajesNoLeidos.length,
            mensajes: mensajesNoLeidos
        });
    } catch (error) {
        console.error('Error al obtener mensajes no leídos:', error);
        res.status(500).json({ mensaje: 'Error al obtener mensajes no leídos' });
    }
};

// Eliminar mensaje
exports.eliminarMensaje = async (req, res) => {
    try {
        const { mensajeId } = req.params;
        const userId = req.user.id;

        const mensaje = await Message.findOne({
            _id: mensajeId,
            emisor: userId
        });

        if (!mensaje) {
            return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
        }

        // Solo permitir eliminar mensajes recientes (menos de 24 horas)
        const tiempoLimite = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        if (Date.now() - mensaje.fechaEnvio > tiempoLimite) {
            return res.status(403).json({ mensaje: 'No se pueden eliminar mensajes con más de 24 horas de antigüedad' });
        }

        await mensaje.remove();
        res.json({ mensaje: 'Mensaje eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar mensaje:', error);
        res.status(500).json({ mensaje: 'Error al eliminar el mensaje' });
    }
};
