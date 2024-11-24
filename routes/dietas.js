// src/routes/dietas.js
const express = require('express');
const router = express.Router();
const dietaController = require('../controllers/dietaController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Middleware para verificar que el usuario es un Trainer
router.use(verificarToken);
router.use(verificarRol('trainer')); // Asumiendo que el rol para entrenadores es 'trainer'

// Rutas para Dietas

// Crear una nueva dieta
router.post('/', dietaController.crearDieta);

// Obtener todas las dietas del entrenador autenticado
router.get('/', dietaController.getAllDietas);

// Nueva ruta para obtener solo las dietas del entrenador autenticado sin populates
router.get('/mis', dietaController.getDietasByTrainer);

// Obtener una dieta específica por ID
router.get('/:id', dietaController.getDietaById);

// Actualizar una dieta por ID
router.put('/:id', dietaController.actualizarDieta);

// Eliminar una dieta por ID
router.delete('/:id', dietaController.eliminarDieta);

module.exports = router;
