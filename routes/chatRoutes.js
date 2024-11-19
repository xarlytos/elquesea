// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatcontroller');

// Ruta para iniciar una conversación con ChatGPT
router.post('/trainer/:trainerId/chat', chatController.chatWithGPT);

module.exports = router;
