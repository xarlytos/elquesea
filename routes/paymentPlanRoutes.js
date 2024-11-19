// routes/paymentPlanRoutes.js

const express = require('express');
const router = express.Router();
const paymentPlanController = require('../controllers/paymentPlanController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Crear un nuevo plan de pago (solo para entrenadores)
router.post('/', verificarToken, verificarRol(['trainer']), paymentPlanController.crearPlanDePago);

// Obtener todos los planes de pago (disponible para todos los usuarios autenticados)
router.get('/', verificarToken, paymentPlanController.obtenerPlanesDePago);

// Obtener un plan de pago específico por ID (disponible para todos los usuarios autenticados)
router.get('/:id', verificarToken, paymentPlanController.obtenerPlanDePagoPorId);

// Actualizar un plan de pago (solo para el entrenador propietario)
router.put('/:id', verificarToken, verificarRol(['trainer']), paymentPlanController.actualizarPlanDePago);

// Eliminar un plan de pago (solo para el entrenador propietario)
router.delete('/:id', verificarToken, verificarRol(['trainer']), paymentPlanController.eliminarPlanDePago);

module.exports = router;
