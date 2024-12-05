const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Ruta para crear un evento (solo accesible para entrenadores)
router.post(
  '/registro',
  [
    verificarToken,
    verificarRol(['trainer']), // Solo entrenadores pueden crear eventos
    check('name', 'El nombre del evento es obligatorio').not().isEmpty(),
    check('type', 'El tipo de evento es obligatorio').not().isEmpty(),
    check('date', 'La fecha del evento debe ser válida').isISO8601(),
  ],
  eventController.createEvent
);

// Ruta para crear un evento de cliente (reunión/cita)
router.post(
  '/client-event',
  [
    verificarToken,
    check('title', 'El título del evento es obligatorio').not().isEmpty(),
    check('date', 'La fecha es obligatoria').not().isEmpty(),
    check('time', 'La hora es obligatoria').not().isEmpty(),
    check('clientId', 'El ID del cliente es obligatorio').not().isEmpty().isMongoId(),
  ],
  eventController.createClientEvent
);

// Ruta para obtener todos los eventos (accesible para todos los usuarios autenticados)
router.get(
  '/',
  verificarToken,
  eventController.getAllEvents
);

// Ruta para obtener un evento por ID (accesible para todos los usuarios autenticados)
router.get(
  '/:id',
  verificarToken,
  eventController.getEventById
);

// Ruta para obtener todos los eventos de un cliente específico
router.get(
  '/client/:clientId',
  [
    verificarToken,
    verificarRol(['trainer', 'admin']), // Solo entrenadores y admins pueden ver eventos de clientes
  ],
  eventController.getClientEvents
);

// Exportar el router
module.exports = router;
