const mongoose = require('mongoose');

const RMSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  ejercicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true }, // Nueva referencia al entrenador
  rm: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RM', RMSchema);
