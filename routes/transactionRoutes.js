// routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Obtener todas las transacciones (solo para entrenadores y administradores)
router.get(
  '/', 
  verificarToken, 
  verificarRol(['trainer', 'admin']), 
  transactionController.obtenerTransacciones
);

// Obtener una transacción específica por ID (disponible para clientes y entrenadores relacionados con la transacción)
router.get('/:id', verificarToken, transactionController.obtenerTransaccionPorId);

// Registrar una transacción (por ejemplo, en una versión sin Stripe)
router.post(
  '/', 
  verificarToken, 
  verificarRol(['trainer', 'client']), 
  transactionController.crearTransaccion
);

module.exports = router;
