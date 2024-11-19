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
    body('monto').isNumeric().withMessage('El monto debe ser un número'),
    body('moneda').isString().withMessage('La moneda es obligatoria'),
    body('descripcion').optional().isString(),
    body('categoria').optional().isString()
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
    body('monto').optional().isNumeric(),
    body('moneda').optional().isString(),
    body('descripcion').optional().isString(),
    body('categoria').optional().isString()
  ],
  expenseController.updateExpense
);

// Ruta para eliminar un gasto
router.delete('/:id', verificarToken, verificarRol(['trainer']), expenseController.deleteExpense);

module.exports = router;
