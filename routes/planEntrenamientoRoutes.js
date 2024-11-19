// routes/planEntrenamientoRoutes.js

const express = require('express');
const router = express.Router();
const planEntrenamientoController = require('../controllers/planEntrenamientoController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { check } = require('express-validator');

// Ruta para crear un plan de entrenamiento (solo entrenadores)
router.post(
  '/',
  verificarToken,                       // Verifica que el usuario esté autenticado
  verificarRol(['trainer']),             // Solo entrenadores pueden crear planes de entrenamiento
  [
    body('nombre').notEmpty().withMessage('El nombre del plan es obligatorio'),
    body('duracion').isString().withMessage('La duración es obligatoria'),
    body('cliente').isMongoId().withMessage('Debe asignarse a un cliente válido')
  ],
  planEntrenamientoController.createPlanEntrenamiento
);

// Ruta para obtener todos los planes del entrenador autenticado o los asignados a un cliente autenticado
router.get('/', verificarToken, planEntrenamientoController.getPlanesEntrenamiento);

// Ruta para obtener un plan de entrenamiento por su ID
router.get('/:id', verificarToken, planEntrenamientoController.getPlanEntrenamientoById);

// Ruta para actualizar un plan de entrenamiento (solo el entrenador creador)
router.put(
  '/:id',
  verificarToken,
  verificarRol(['trainer']),
  [
    body('nombre').optional().isString(),
    body('duracion').optional().isString(),
    body('meta').optional().isString()
  ],
  planEntrenamientoController.updatePlanEntrenamiento
);

// Ruta para eliminar un plan de entrenamiento (solo el entrenador creador)
router.delete('/:id', verificarToken, verificarRol(['trainer']), planEntrenamientoController.deletePlanEntrenamiento);
// Nueva ruta para crear una rutina simple
router.post(
  '/rutina-simple',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    check('duracion', 'La duración es obligatoria').not().isEmpty(),
    check('fechaInicio', 'La fecha de inicio es obligatoria').isISO8601(),
    check('meta', 'La meta es obligatoria').not().isEmpty(),
    check('cliente', 'El cliente es obligatorio').not().isEmpty()
  ],
  planEntrenamientoController.createSimplePlanEntrenamiento
);

module.exports = router;
