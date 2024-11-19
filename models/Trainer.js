// models/Trainer.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TrainerSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  rol: { type: String, default: 'trainer' },
  servicios: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  ingresos: [{ type: Schema.Types.ObjectId, ref: 'Income' }],
  gastos: [{ type: Schema.Types.ObjectId, ref: 'Expense' }],
  clientes: [{ type: Schema.Types.ObjectId, ref: 'Client' }],
  ingresosTotales: { type: Number, default: 0 },
  fechaRegistro: { type: Date, default: Date.now },
  tokensUsados: { type: Number, default: 0 } // Agrega el campo para el uso de tokens
});

module.exports = mongoose.model('Trainer', TrainerSchema);
