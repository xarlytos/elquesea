// models/Expense.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExpenseSchema = new Schema({
  entrenador: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  importe: { type: Number, required: true },
  moneda: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  descripcion: String,
  categoria: String,
  tipo: {
    type: String,
    enum: ['fijo', 'variable'],
    required: true
  },
  // Añadir referencias a Client y Service
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
