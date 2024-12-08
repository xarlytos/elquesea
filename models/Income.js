// models/Income.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const IncomeSchema = new Schema({
  entrenador: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  cliente: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  planDePago: { type: Schema.Types.ObjectId, ref: 'PaymentPlan', required: true },
  monto: { type: Number, required: true },
  moneda: { type: String, required: true },
  estado: { 
    type: String, 
    enum: ['pendiente', 'pagado', 'cancelado'],
    default: 'pendiente'
  },
  metodoPago: {
    type: String,
    enum: ['stripe', 'efectivo'],
    required: true
  },
  fecha: { type: Date, default: Date.now },
  descripcion: String,
  transaccion: { type: Schema.Types.ObjectId, ref: 'Transaction' }
});

// Middleware pre-save para asegurar que los campos requeridos estén presentes
IncomeSchema.pre('save', function(next) {
  if (!this.cliente) {
    next(new Error('El campo cliente es requerido'));
  }
  if (!this.planDePago) {
    next(new Error('El campo planDePago es requerido'));
  }
  if (!this.metodoPago) {
    next(new Error('El campo metodoPago es requerido'));
  }
  next();
});

module.exports = mongoose.model('Income', IncomeSchema);
