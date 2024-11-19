const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body, validationResult } = require('express-validator');

// Middleware personalizado para ver errores de validación
const logValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array()); // Log de errores de validación
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Registro de un nuevo entrenador
router.post(
  '/registro/entrenador',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Correo inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  logValidationErrors,
  authController.registerTrainer
);

// Registro de un nuevo cliente
router.post(
  '/registro/cliente',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Correo inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  logValidationErrors,
  authController.registerClient
);

// Login de un entrenador
router.post(
  '/login/entrenador',
  [
    body('email').isEmail().withMessage('Correo inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
  ],
  logValidationErrors,
  authController.loginTrainer
);

// Login de un cliente
router.post(
  '/login/cliente',
  [
    body('email').isEmail().withMessage('Correo inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
  ],
  logValidationErrors,
  authController.loginClient
);

module.exports = router;
