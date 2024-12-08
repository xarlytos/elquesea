const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const trainerClientChatController = require('../controllers/trainerClientChatController');
const messageController = require('../controllers/messageController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const validarCampos = require('../middlewares/validarCampos');

// Middleware para todas las rutas
router.use(verificarToken);

// Rutas para gestión de chats
router.get('/iniciar/:clienteId',
    [
        verificarRol(['trainer']),
        check('clienteId', 'ID de cliente no válido').isMongoId(),
        validarCampos
    ],
    trainerClientChatController.iniciarObtenerChat
);

router.get('/trainer',
    verificarRol(['trainer']),
    trainerClientChatController.obtenerChatsTrainer
);

router.get('/cliente',
    verificarRol(['cliente']),
    trainerClientChatController.obtenerChatsCliente
);

router.get('/:chatId',
    [
        check('chatId', 'ID de chat no válido').isMongoId(),
        validarCampos
    ],
    trainerClientChatController.obtenerChatPorId
);

router.put('/:chatId/archivar',
    [
        check('chatId', 'ID de chat no válido').isMongoId(),
        validarCampos
    ],
    trainerClientChatController.archivarChat
);

router.get('/:chatId/estadisticas',
    [
        check('chatId', 'ID de chat no válido').isMongoId(),
        validarCampos
    ],
    trainerClientChatController.obtenerEstadisticasChat
);

// Rutas para mensajes dentro de un chat específico
router.post('/:chatId/mensajes',
    [
        check('chatId', 'ID de chat no válido').isMongoId(),
        check('contenido', 'El contenido del mensaje es obligatorio').notEmpty(),
        check('tipo', 'Tipo de mensaje no válido').optional().isIn(['texto', 'imagen', 'archivo']),
        check('urlArchivo', 'URL del archivo no válida').optional().isURL(),
        validarCampos
    ],
    messageController.enviarMensaje
);

router.get('/:chatId/mensajes',
    [
        check('chatId', 'ID de chat no válido').isMongoId(),
        validarCampos
    ],
    messageController.obtenerMensajes
);

module.exports = router;
