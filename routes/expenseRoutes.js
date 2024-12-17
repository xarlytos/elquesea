// routes/expenseRoutes.js

const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Ruta para crear un nuevo gasto (solo los entrenadores pueden registrar gastos)
router.post(
  '/',
  verificarToken,               // Verifica que el usuario esté autenticado
  verificarRol(['trainer']),     // Solo los entrenadores pueden registrar gastos
  [
    body('importe').isNumeric().withMessage('El importe debe ser un número'),
    body('moneda').isString().withMessage('La moneda es obligatoria'),
    body('fecha').isISO8601().withMessage('La fecha debe ser válida'),
    body('descripcion').optional().isString().withMessage('La descripción debe ser texto'),
    body('categoria').optional().isString().withMessage('La categoría debe ser texto'),
    body('tipo').isString().withMessage('El tipo es obligatorio')
  ],
  expenseController.createExpense
);

// Ruta para obtener todos los gastos del entrenador autenticado
router.get('/', verificarToken, verificarRol(['trainer']), expenseController.getExpenses);

// Ruta para obtener un gasto por su ID
router.get('/:id', verificarToken, verificarRol(['trainer']), expenseController.getExpenseById);

// Ruta para actualizar un gasto
router.put(
  '/:id',
  verificarToken,
  verificarRol(['trainer']),
  [
    body('importe').optional().isNumeric().withMessage('El importe debe ser un número'),
    body('moneda').optional().isString().withMessage('La moneda debe ser texto'),
    body('fecha').optional().isISO8601().withMessage('La fecha debe ser válida'),
    body('descripcion').optional().isString().withMessage('La descripción debe ser texto'),
    body('categoria').optional().isString().withMessage('La categoría debe ser texto'),
    body('tipo').optional().isString().withMessage('El tipo debe ser texto')
  ],
  expenseController.updateExpense
);

// Ruta para asociar cliente o servicio a un gasto
router.patch('/:id/asociar', verificarToken, verificarRol(['trainer']), expenseController.asociarGasto);

// Ruta para eliminar un gasto
router.delete('/:id', verificarToken, verificarRol(['trainer']), expenseController.deleteExpense);

module.exports = router;
