// controllers/expenseController.js

const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Crear un nuevo gasto
exports.createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { monto, moneda, fecha, descripcion, categoria } = req.body;
    const entrenadorId = req.user.id; // asumimos que el ID del entrenador está en el token

    const newExpense = new Expense({
      entrenador: entrenadorId,
      monto,
      moneda,
      fecha,
      descripcion,
      categoria
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear gasto', error });
  }
};

// Obtener todos los gastos del entrenador autenticado
exports.getExpenses = async (req, res) => {
  try {
    const entrenadorId = req.user.id;
    const expenses = await Expense.find({ entrenador: entrenadorId });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener gastos', error });
  }
};

// Obtener un gasto por ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || expense.entrenador.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener gasto', error });
  }
};

// Actualizar un gasto
exports.updateExpense = async (req, res) => {
  try {
    const { monto, moneda, fecha, descripcion, categoria } = req.body;
    let expense = await Expense.findById(req.params.id);

    if (!expense || expense.entrenador.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { monto, moneda, fecha, descripcion, categoria },
      { new: true }
    );

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar gasto', error });
  }
};

// Eliminar un gasto
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.entrenador.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }

    await expense.remove();
    res.json({ message: 'Gasto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar gasto', error });
  }
};
