const express = require('express');
const economicAlertController = require('../controllers/economicAlertController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const router = express.Router();

// Proteger todas las rutas
router.use(verificarToken);

// Rutas públicas (requieren token válido)
router.get('/', economicAlertController.getAllAlerts);
router.get('/upcoming', economicAlertController.getUpcomingAlerts);
router.get('/:id', economicAlertController.getAlert);

// Rutas protegidas (solo trainer)
router
    .route('/')
    .post(verificarRol('trainer'), economicAlertController.createAlert);

router
    .route('/:id')
    .patch(verificarRol('trainer'), economicAlertController.updateAlert)
    .delete(verificarRol('trainer'), economicAlertController.deleteAlert);

module.exports = router;
