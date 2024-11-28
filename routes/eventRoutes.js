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

// Exportar el router
module.exports = router;
