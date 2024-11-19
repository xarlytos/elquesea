// routes/exerciseRoutes.js

const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Ruta para crear un nuevo ejercicio (solo entrenadores)
router.post(
  '/',
  verificarToken,                     // Verifica que el usuario esté autenticado
  verificarRol(['trainer']),           // Verifica que el rol sea 'trainer'
  [
    body('nombre').notEmpty().withMessage('El nombre del ejercicio es obligatorio'),
    body('tipo').notEmpty().withMessage('El tipo de ejercicio es obligatorio'),
    body('grupoMuscular').isArray().withMessage('El grupo muscular debe ser un array')
  ],
  exerciseController.createExercise
);

// Ruta para obtener todos los ejercicios
router.get('/', verificarToken, exerciseController.getExercises);

// Ruta para obtener un ejercicio por su ID
router.get('/:id', verificarToken, exerciseController.getExerciseById);

// Ruta para actualizar un ejercicio (solo entrenadores)
router.put(
  '/:id',
  verificarToken,
  verificarRol(['trainer']),
  [
    body('nombre').optional().isString(),
    body('tipo').optional().isString(),
    body('grupoMuscular').optional().isArray(),
    body('descripcion').optional().isString(),
    body('equipo').optional().isString(),
    body('imgUrl').optional().isURL().withMessage('La imagen debe ser una URL válida')
  ],
  exerciseController.updateExercise
);

// Ruta para eliminar un ejercicio (solo entrenadores)
router.delete('/:id', verificarToken, verificarRol(['trainer']), exerciseController.deleteExercise);

module.exports = router;
