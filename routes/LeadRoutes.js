const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Ruta para obtener todos los leads del entrenador autenticado
router.get(
  '/',
  verificarToken,              // Verifica que el usuario esté autenticado
  verificarRol(['trainer']),    // Solo los entrenadores pueden acceder a esta ruta
  leadController.getLeads
);

// Ruta para obtener un lead específico por ID
router.get(
  '/:id',
  verificarToken,              // Verifica que el usuario esté autenticado
  verificarRol(['trainer']),    // Solo los entrenadores pueden acceder a esta ruta
  leadController.getLeadById
);

// Ruta para crear un nuevo lead
router.post(
  '/',
  verificarToken,              // Verifica que el usuario esté autenticado
  verificarRol(['trainer']),    // Solo los entrenadores pueden acceder a esta ruta
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('El email debe ser válido'),
    body('phone').notEmpty().withMessage('El teléfono es obligatorio'),
    body('status')
      .optional()
      .isIn(['new', 'interested', 'not interested'])
      .withMessage('Estado no válido'),
    body('origen')
      .optional()
      .isIn(['web', 'referral', 'social media', 'other'])
      .withMessage('Origen no válido')
  ],
  leadController.createLead
);

// Ruta para actualizar un lead por ID
router.put(
  '/:id',
  verificarToken,              // Verifica que el usuario esté autenticado
  verificarRol(['trainer']),    // Solo los entrenadores pueden acceder a esta ruta
  [
    body('name').optional().isString(),
    body('email').optional().isEmail(),
    body('phone').optional().isString(),
    body('status')
      .optional()
      .isIn(['new', 'interested', 'not interested'])
      .withMessage('Estado no válido'),
    body('origen')
      .optional()
      .isIn(['web', 'referral', 'social media', 'other'])
      .withMessage('Origen no válido')
  ],
  leadController.updateLead
);

// Ruta para eliminar un lead por ID
router.delete(
  '/:id',
  verificarToken,              // Verifica que el usuario esté autenticado
  verificarRol(['trainer']),    // Solo los entrenadores pueden acceder a esta ruta
  leadController.deleteLead
);

module.exports = router;
