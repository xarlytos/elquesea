const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Validaciones comunes para eventos
const eventValidations = [
  check('title', 'El título es obligatorio').not().isEmpty(),
  check('startDate', 'La fecha de inicio es obligatoria').isISO8601(),
  check('endDate', 'La fecha de fin es obligatoria').isISO8601(),
  check('type', 'El tipo de evento debe ser válido')
    .isIn(['TAREA_PROPIA', 'CITA_CON_CLIENTE', 'RUTINA_CLIENTE', 'PAGO_CLIENTE', 'ALARMA', 'GENERAL']),
  check('origin', 'El origen debe ser válido')
    .isIn(['PROPIO', 'CLIENTE']),
  check('isWorkRelated', 'isWorkRelated debe ser un valor booleano').isBoolean(),
  check('alerts.*.type', 'El tipo de alerta debe ser válido')
    .optional()
    .isIn(['email', 'push', 'sms', 'popup']),
  check('alerts.*.timeBeforeEvent', 'El tiempo de alerta debe ser un número positivo')
    .optional()
    .isInt({ min: 1 })
];

// Crear un evento
router.post(
  '/',
  [
    verificarToken,
    verificarRol(['trainer', 'admin']),
    ...eventValidations
  ],
  eventController.createEvent
);

// Obtener todos los eventos con filtros opcionales
router.get(
  '/',
  [
    verificarToken,
    verificarRol(['trainer', 'admin'])
  ],
  eventController.getAllEvents
);

// Obtener un evento específico por ID
router.get(
  '/:id',
  [
    verificarToken,
    verificarRol(['trainer', 'admin']),
    check('id', 'ID no válido').isMongoId()
  ],
  eventController.getEventById
);

// Actualizar un evento
router.put(
  '/:id',
  [
    verificarToken,
    verificarRol(['trainer', 'admin']),
    check('id', 'ID no válido').isMongoId(),
    ...eventValidations
  ],
  eventController.updateEvent
);

// Eliminar un evento
router.delete(
  '/:id',
  [
    verificarToken,
    verificarRol(['trainer', 'admin']),
    check('id', 'ID no válido').isMongoId()
  ],
  eventController.deleteEvent
);

// Obtener eventos por cliente
router.get(
  '/client/:clientId',
  [
    verificarToken,
    verificarRol(['trainer', 'admin']),
    check('clientId', 'ID de cliente no válido').isMongoId()
  ],
  eventController.getEventsByClient
);

// Obtener eventos por trainer
router.get(
  '/trainer/:trainerId',
  [
    verificarToken,
    verificarRol(['trainer', 'admin']),
    check('trainerId', 'ID de trainer no válido').isMongoId()
  ],
  eventController.getEventsByTrainer
);

// Obtener eventos por rango de fechas
router.get(
  '/date-range/search',
  [
    verificarToken,
    verificarRol(['trainer', 'admin']),
    check('startDate', 'Fecha de inicio válida requerida').isISO8601(),
    check('endDate', 'Fecha de fin válida requerida').isISO8601()
  ],
  eventController.getEventsByDateRange
);

module.exports = router;
