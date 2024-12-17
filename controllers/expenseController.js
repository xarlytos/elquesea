// controllers/expenseController.js

const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');
const Client = require('../models/Client'); // Importar modelo de Cliente
const Service = require('../models/Service'); // Importar modelo de Servicio
const catchAsync = require('../utils/catchAsync'); // Importar función catchAsync

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
exports.getExpenses = catchAsync(async (req, res) => {
    const gastos = await Expense.find({ entrenador: req.user.id })
        .populate('client', 'nombre email telefono') // Poblar datos relevantes del cliente
        .populate('service', 'nombre descripcion precio'); // Poblar datos relevantes del servicio

    res.status(200).json({
        status: 'success',
        results: gastos.length,
        data: {
            gastos
        }
    });
});

// Obtener un gasto por ID
exports.getExpenseById = catchAsync(async (req, res) => {
    const gasto = await Expense.findOne({ 
        _id: req.params.id,
        entrenador: req.user.id 
    })
    .populate('client', 'nombre email telefono')
    .populate('service', 'nombre descripcion precio');

    if (!gasto) {
        return res.status(404).json({
            status: 'error',
            message: 'Gasto no encontrado'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            gasto
        }
    });
});

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

// Asociar cliente o servicio a un gasto
exports.asociarGasto = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { clientId, serviceId } = req.body;

    if (!clientId && !serviceId) {
        return res.status(400).json({
            status: 'error',
            message: 'Debe proporcionar un clientId o serviceId'
        });
    }

    const gasto = await Expense.findById(id);
    if (!gasto) {
        return res.status(404).json({
            status: 'error',
            message: 'Gasto no encontrado'
        });
    }

    // Verificar y asociar cliente
    if (clientId) {
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                status: 'error',
                message: 'Cliente no encontrado'
            });
        }
        gasto.client = clientId;
    }

    // Verificar y asociar servicio
    if (serviceId) {
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                status: 'error',
                message: 'Servicio no encontrado'
            });
        }
        gasto.service = serviceId;
    }

    await gasto.save();

    res.status(200).json({
        status: 'success',
        data: {
            gasto
        }
    });
});
