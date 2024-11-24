const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClientSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Encriptar antes de guardar
  planesDePago: [{ type: Schema.Types.ObjectId, ref: 'PaymentPlan' }],
  servicios: { type: [{ type: Schema.Types.ObjectId, ref: 'Service' }], default: [] },

  transacciones: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  fechaRegistro: { type: Date, default: Date.now },
  trainer: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true } // Referencia al entrenador
});

module.exports = mongoose.model('Client', ClientSchema);
