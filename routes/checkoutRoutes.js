// routes/checkoutRoutes.js

const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Crear una sesión de checkout en Stripe
router.post(
  '/create-checkout-session',
  authMiddleware('client'), // Solo clientes pueden crear una sesión de pago
  [
    body('planDePagoId').isMongoId().withMessage('El ID del plan de pago es inválido')
  ],
  checkoutController.createCheckoutSession
);

module.exports = router;
