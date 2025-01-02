const express = require('express');
const router = express.Router();
const { 
    emailValidations, 
    sendEmail, 
    campaignValidations,
    createCampaign,
    checkCampaignStatus,
    sendWelcomeEmail,
    toggleBirthdayEmail
} = require('../controllers/emailController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Ruta básica de envío de email
router.post('/send', emailValidations, sendEmail);

// Rutas de campaña (protegidas por autenticación)
router.post('/campaign/create', [verificarToken, verificarRol(['trainer'])], campaignValidations, createCampaign);
router.post('/campaign/status', [verificarToken, verificarRol(['trainer'])], checkCampaignStatus);

// Ruta para envío automático de correo de bienvenida
router.post('/welcome', [verificarToken, verificarRol(['trainer'])], sendWelcomeEmail);

// Ruta para gestionar felicitaciones de cumpleaños
router.post('/birthday/toggle', [verificarToken, verificarRol(['trainer'])], toggleBirthdayEmail);

module.exports = router;
