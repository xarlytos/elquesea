// src/routes/planningRoutes.js
const express = require('express');
const router = express.Router();
const planningController = require('../controllers/planningController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Middleware para verificar que el usuario es un Trainer
const esTrainer = verificarRol('trainer');

// Rutas para Plannings
router.get('/', verificarToken, esTrainer, planningController.getAllPlannings); // Obtener todos los plannings con subdocumentos
router.get('/schemas', verificarToken, esTrainer, planningController.getAllPlanningSchemas); // Obtener solo los plannings sin subdocumentos
router.get('/:id', verificarToken, esTrainer, planningController.getPlanningById); // Obtener un planning por ID con subdocumentos
router.post('/', verificarToken, esTrainer, planningController.createPlanning); // Crear un nuevo planning con una semana por defecto
router.put('/:id', verificarToken, esTrainer, planningController.updatePlanning); // Actualizar un planning existente
router.post('/:id/anadirsemanasiguiente', verificarToken, esTrainer, planningController.addNextWeek); // Añadir una semana siguiente
router.delete('/:id', verificarToken, esTrainer, planningController.deletePlanning); // Eliminar un planning

// Rutas para CheckIns
router.post('/sets/:setId/checkins', verificarToken, esTrainer, planningController.addCheckInToSet); // Añadir un CheckIn a un Set
router.get('/sets/:setId/checkins', verificarToken, esTrainer, planningController.getCheckInsForSet); // Obtener todos los CheckIns de un Set

module.exports = router;
