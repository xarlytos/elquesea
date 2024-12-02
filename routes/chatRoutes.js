// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Cada ruta con su propio prompt específico
router.post('/chat1', chatController.handleChat.bind(null, 1));
router.post('/chat2', chatController.handleChat.bind(null, 2));
router.post('/chat3', chatController.handleChat.bind(null, 3));
router.post('/chat4', chatController.handleChat.bind(null, 4));
router.post('/chat5', chatController.handleChat.bind(null, 5));
router.post('/chat6', chatController.handleChat.bind(null, 6));
router.post('/chat7', chatController.handleChat.bind(null, 7));
router.post('/chat8', chatController.handleChat.bind(null, 8));
router.post('/chat9', chatController.handleChat.bind(null, 9));

module.exports = router;
