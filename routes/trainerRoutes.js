const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Ruta para el registro de entrenadores
router.post(
  '/registro',
  [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'Agrega un email válido').isEmail(),
    check('password', 'El password debe ser mínimo de 6 caracteres').isLength({ min: 6 }),
  ],
  trainerController.registrarEntrenador
);

// Ruta pública: Obtener todos los entrenadores (sin autenticación)
router.get('/', trainerController.obtenerEntrenadores);

// Rutas protegidas (requieren autenticación y rol 'trainer')

// Obtener el perfil del entrenador autenticado
router.get(
  '/perfil',
  verificarToken,
  verificarRol(['trainer']),
  trainerController.obtenerPerfilEntrenador
);

// Actualizar el perfil del entrenador autenticado
router.put(
  '/perfil',
  verificarToken,
  verificarRol(['trainer']),
  trainerController.actualizarEntrenador
);

// Eliminar la cuenta del entrenador autenticado
router.delete(
  '/perfil',
  verificarToken,
  verificarRol(['trainer']),
  trainerController.eliminarEntrenador
);

// Obtener un entrenador por ID (ruta protegida, requiere autenticación)
router.get(
  '/:id',
  verificarToken,
  verificarRol(['trainer']),
  trainerController.obtenerEntrenadorPorId
);

module.exports = router;
