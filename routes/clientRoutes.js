const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');
const { obtenerClientes } = require('../controllers/clientController');

router.post(
  '/registro',
  [
    verificarToken, // Verifica que el usuario esté autenticado
    verificarRol(['trainer']), // Asegura que solo los entrenadores puedan registrar clientes
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'Agrega un email válido').isEmail(),
    check('password', 'El password debe ser mínimo de 6 caracteres').isLength({ min: 6 }),
  ],
  clientController.registrarCliente
);


// Ruta para obtener el perfil del cliente autenticado
router.get(
  '/perfil',
  verificarToken,
  verificarRol(['client']),
  clientController.obtenerPerfilCliente
);

// Ruta para actualizar el perfil del cliente autenticado
router.put(
  '/perfil',
  verificarToken,
  verificarRol(['client']),
  clientController.actualizarCliente
);

// Ruta para eliminar el perfil del cliente autenticado
router.delete(
  '/perfil',
  verificarToken,
  verificarRol(['client']),
  clientController.eliminarCliente
);

// Ruta GET /api/clientes
router.get('/', verificarToken, obtenerClientes);

// Exportar el router
module.exports = router;
