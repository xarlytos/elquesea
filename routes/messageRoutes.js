const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const messageController = require('../controllers/messageController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const validarCampos = require('../middlewares/validarCampos');

// Middleware para todas las rutas
router.use(verificarToken);

// Enviar mensaje a un chat específico
router.post('/chats/:chatId/mensajes',
    [
        check('chatId', 'El ID del chat es obligatorio').isMongoId(),
        check('contenido', 'El contenido del mensaje es obligatorio').notEmpty(),
        check('tipo', 'Tipo de mensaje no válido').optional().isIn(['texto', 'imagen', 'archivo']),
        check('urlArchivo', 'URL del archivo no válida').optional().isURL(),
        validarCampos
    ],
    messageController.enviarMensaje
);

// Obtener mensajes de un chat específico
router.get('/chats/:chatId/mensajes',
    [
        check('chatId', 'ID de chat no válido').isMongoId(),
        validarCampos
    ],
    messageController.obtenerMensajes
);

// Marcar mensaje como leído
router.put('/mensajes/:mensajeId/leer',
    [
        check('mensajeId', 'ID de mensaje no válido').isMongoId(),
        validarCampos
    ],
    messageController.marcarComoLeido
);

// Obtener mensajes no leídos
router.get('/mensajes/no-leidos', messageController.obtenerMensajesNoLeidos);

// Eliminar mensaje
router.delete('/mensajes/:mensajeId',
    [
        check('mensajeId', 'ID de mensaje no válido').isMongoId(),
        validarCampos
    ],
    messageController.eliminarMensaje
);

module.exports = router;
