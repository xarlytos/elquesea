// src/routes/planningRoutes.js
const express = require('express');
const router = express.Router();
const planningController = require('../controllers/planningController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check, param, body, validationResult } = require('express-validator');

// Middleware para verificar que el usuario es un Trainer
const esTrainer = verificarRol('trainer');

// Middleware para validar la solicitud
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Rutas para Plannings
router.get('/', verificarToken, esTrainer, planningController.getAllPlannings); 
router.get('/schemas', verificarToken, esTrainer, planningController.getAllPlanningSchemas); 
router.get('/:id', verificarToken, esTrainer, planningController.getPlanningById); 
router.post('/', verificarToken, esTrainer, planningController.createPlanning); 
router.put('/:id', verificarToken, esTrainer, planningController.updatePlanning); 
router.post('/:id/anadirsemanasiguiente', verificarToken, esTrainer, planningController.addNextWeek); 
router.delete('/:id', verificarToken, esTrainer, planningController.deletePlanning); 

// Rutas para CheckIns
router.post('/sets/:setId/checkins', verificarToken, esTrainer, planningController.addCheckInToSet); 
router.get('/sets/:setId/checkins', verificarToken, esTrainer, planningController.getCheckInsForSet); 

// Ruta para asignar un esqueleto a un planning
router.post(
  '/:planningId/assign-esqueleto',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('planningId', 'ID de planning inválido').isMongoId(),
    check('esqueletoId', 'ID de esqueleto inválido').isMongoId(),
  ],
  validateRequest,
  planningController.assignEsqueletoToPlanning
);

// Rutas de sesión
router.post(
  '/session',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('planningId', 'ID de planning inválido').isMongoId(),
    check('weekNumber', 'Número de semana requerido').isInt({ min: 1 }),
    check('day', 'Día de la semana requerido').isString(),
    check('sessionData.name', 'Nombre de la sesión requerido').not().isEmpty(),
  ],
  validateRequest,
  planningController.createSession
);

router.delete(
  '/session/:sessionId',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('sessionId', 'ID de sesión inválido').isMongoId(),
  ],
  validateRequest,
  planningController.deleteSession
);

// Rutas de ejercicio
router.post('/session/:sessionId/exercise', verificarToken, esTrainer, planningController.createExercise);

// Nueva ruta para añadir ejercicio a una sesión específica
router.post(
    '/:planningId/weeks/:weekNumber/days/:day/sessions/:sessionId/exercises',
    [
        verificarToken,
        verificarRol(['trainer']),
        check('planningId', 'ID de planning inválido').isMongoId(),
        check('weekNumber', 'Número de semana debe ser un número válido').isInt({ min: 1 }),
        check('day', 'Día de la semana es requerido').isString(),
        check('sessionId', 'ID de sesión inválido').isMongoId(),
        check('exerciseId', 'ID de ejercicio es requerido').isMongoId(),
    ],
    validateRequest,
    planningController.addExerciseToSession
);

// Ruta para actualizar un ejercicio específico en una sesión
router.put('/:planningId/weeks/:weekNumber/days/:day/sessions/:sessionId/exercises/:exerciseId',
  [
    verificarToken,
    esTrainer,
    param('planningId').isMongoId(),
    param('weekNumber').isInt({ min: 1 }),
    param('day').isString(),
    param('sessionId').isMongoId(),
    param('exerciseId').isMongoId(),
    body('sets').isArray(),
    body('sets.*.reps').optional().isInt({ min: 0 }),
    body('sets.*.weight').optional().isFloat({ min: 0 }),
    body('sets.*.rest').optional().isInt({ min: 0 }),
    body('sets.*.tempo').optional().isString(),
    body('sets.*.rpe').optional().isInt({ min: 0, max: 10 }),
    body('sets.*.rir').optional().isInt({ min: 0 }),
    body('sets.*.completed').optional().isBoolean()
  ],
  validateRequest,
  planningController.updatePlanningExercise
);

// Ruta para actualizar la configuración de renderizado de un set
router.patch(
    '/:planningId/weeks/:weekNumber/days/:day/sessions/:sessionId/exercises/:exerciseId/sets/:setId/render-config',
    [
        verificarToken,
        esTrainer,
        param('planningId', 'ID de planning inválido').isMongoId(),
        param('weekNumber', 'Número de semana debe ser un número válido').isInt({ min: 1 }),
        param('day', 'Día de la semana es requerido').isString(),
        param('sessionId', 'ID de sesión inválido').isMongoId(),
        param('exerciseId', 'ID de ejercicio inválido').isMongoId(),
        param('setId', 'ID de set inválido').isMongoId(),
        body('campo1').optional().isString(),
        body('campo2').optional().isString(),
        body('campo3').optional().isString()
    ],
    validateRequest,
    planningController.updateSetRenderConfig
);

// Ruta para copiar una rutina a un día específico
router.post(
  '/:planningId/weeks/:weekNumber/days/:day/copy-routine',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('planningId', 'ID de planning inválido').isMongoId(),
    check('weekNumber', 'Número de semana debe ser un número válido').isInt({ min: 1 }),
    check('day', 'Día de la semana es requerido').isString(),
    check('routineData', 'Se requiere la información de la rutina').isObject(),
    check('routineData.exercises', 'Se requiere un array de ejercicios').isArray(),
  ],
  validateRequest,
  planningController.copyRoutineToDay
);

module.exports = router;
