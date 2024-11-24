// models/Expense.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExpenseSchema = new Schema({
  entrenador: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  monto: { type: Number, required: true },
  moneda: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  descripcion: String,
  categoria: String
});

module.exports = mongoose.model('Expense', ExpenseSchema);
