// routes/serviceRoutes.js

const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Rutas para servicios

// Crear un nuevo servicio (solo entrenadores)
router.post(
  '/',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('tipo', 'El tipo de servicio es obligatorio').not().isEmpty(),
  ],
  serviceController.crearServicio
);

// Obtener todos los servicios (disponible para todos)
router.get('/', serviceController.obtenerServicios);
// Obtener todas las clases grupales
router.get('/clases-grupales', serviceController.obtenerClasesGrupales);

// Obtener un servicio por ID (disponible para todos)
router.get('/:id', serviceController.obtenerServicioPorId);

// Actualizar un servicio (solo propietario del servicio)
router.put(
  '/:id',
  verificarToken,
  verificarRol(['trainer']),
  serviceController.actualizarServicio
);

// Eliminar un servicio (solo propietario del servicio)
router.delete(
  '/:id',
  verificarToken,
  verificarRol(['trainer']),
  serviceController.eliminarServicio
);



module.exports = router;
