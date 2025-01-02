const express = require('express');
const router = express.Router();
const {
    campaignValidations,
    createTipsCampaign,
    pauseCampaign,
    resumeCampaign
} = require('../controllers/tipsCampaignController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Middleware de autenticación para todas las rutas
router.use(verificarToken, verificarRol(['trainer']));

// Crear nueva campaña de consejos
router.post('/create', campaignValidations, createTipsCampaign);

// Pausar campaña
router.put('/:campaignId/pause', pauseCampaign);

// Reanudar campaña
router.put('/:campaignId/resume', resumeCampaign);

module.exports = router;
