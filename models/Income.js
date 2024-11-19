// models/Income.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const IncomeSchema = new Schema({
  entrenador: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  monto: { type: Number, required: true },
  moneda: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  descripcion: String,
  transaccion: { type: Schema.Types.ObjectId, ref: 'Transaction' }
});

module.exports = mongoose.model('Income', IncomeSchema);
