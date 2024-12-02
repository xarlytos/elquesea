// models/PaymentPlan.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentPlanSchema = new Schema({
  precio: { type: Number, required: true },
  moneda: { type: String, default: 'EUR' },
  frecuencia: {
    type: String,
    enum: ['Único', 'Mensual', 'Trimestral', 'Anual'],
    required: true
  },
  detalles: String,
  stripeProductId: String,
  stripePriceId: String,
  servicio: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  clientes: [{ type: Schema.Types.ObjectId, ref: 'Client' }],
  fechaCreacion: { type: Date, default: Date.now }
});

// Evitar la recompilación del modelo si ya existe
module.exports = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema);
