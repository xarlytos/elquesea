// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Cada ruta con su propio prompt específico
router.post('/chat1', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 1));
router.post('/chat2', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 2));
router.post('/chat3', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 3));
router.post('/chat4', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 4));
router.post('/chat5', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 5));
router.post('/chat6', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 6));
router.post('/chat7', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 7));
router.post('/chat8', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 8));
router.post('/chat9', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleChat.bind(null, 9));

// Ruta para la estrategia de contenido
router.post('/content-strategy', verificarToken, verificarRol(['admin', 'trainer']), chatController.handleContentStrategy);

module.exports = router;
