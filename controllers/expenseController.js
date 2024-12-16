// controllers/expenseController.js

const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Crear un nuevo gasto
exports.createExpense = async (req, res) => {
  console.log('⭐ Iniciando creación de nuevo gasto...');
  console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Error de validación:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    const { importe, moneda, fecha, descripcion, categoria, tipo } = req.body;
    const entrenadorId = req.user.id;
    
    console.log('👤 ID del entrenador:', entrenadorId);
    console.log('💰 Importe y moneda:', { importe, moneda });
    console.log('📅 Fecha:', fecha);
    console.log('📋 Detalles:', { descripcion, categoria, tipo });

    const newExpense = new Expense({
      entrenador: entrenadorId,
      importe,
      moneda,
      fecha,
      descripcion,
      categoria,
      tipo
    });

    console.log('📦 Objeto gasto creado:', JSON.stringify(newExpense, null, 2));
    
    const savedExpense = await newExpense.save();
    console.log('✅ Gasto guardado exitosamente:', JSON.stringify(savedExpense, null, 2));
    
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('❌ Error al crear gasto:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Error al crear gasto', error: error.message });
  }
};

// Obtener todos los gastos del entrenador autenticado
exports.getExpenses = async (req, res) => {
  try {
    console.log('\n=== GET ALL EXPENSES REQUEST ===');
    console.log('User from request:', req.user);
    console.log('Headers:', req.headers);

    let query = { entrenador: req.user.id };
    console.log('Query filter:', query);

    const expenses = await Expense.find(query);
    console.log('Found expenses count:', expenses.length);

    res.json(expenses);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error in getExpenses:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener un gasto por ID
exports.getExpenseById = async (req, res) => {
  try {
    console.log('\n=== GET EXPENSE BY ID REQUEST ===');
    console.log('Expense ID:', req.params.id);
    console.log('User from request:', req.user);
    console.log('Headers:', req.headers);

    const expense = await Expense.findOne({
      _id: req.params.id,
      entrenador: req.user.id
    });

    console.log('Found expense:', expense);

    if (!expense) {
      console.log('Expense not found');
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }

    res.json(expense);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un gasto
exports.updateExpense = async (req, res) => {
  try {
    const { importe, moneda, fecha, descripcion, categoria, tipo } = req.body;
    let expense = await Expense.findById(req.params.id);

    if (!expense || expense.entrenador.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { importe, moneda, fecha, descripcion, categoria, tipo },
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
    console.log('Delete Expense Request Received');
    console.log('Request Params:', req.params);
    console.log('Request User:', req.user);

    const expense = await Expense.findById(req.params.id);
    console.log('Found Expense:', expense);

    if (!expense || expense.entrenador.toString() !== req.user.id) {
      console.log('Expense Not Found or User Not Authorized');
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }

    await Expense.deleteOne({ _id: req.params.id });
    console.log('Expense Deleted Successfully');
    res.json({ message: 'Gasto eliminado' });
  } catch (error) {
    console.error('Error Deleting Expense:', error);
    res.status(500).json({ message: 'Error al eliminar gasto', error });
  }
};
