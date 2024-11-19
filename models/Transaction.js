// models/Transaction.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionSchema = new Schema({
  cliente: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  planDePago: { type: Schema.Types.ObjectId, ref: 'PaymentPlan', required: true },
  monto: { type: Number, required: true },
  moneda: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  estado: {
    type: String,
    enum: ['Pendiente', 'Completada', 'Fallida'],
    default: 'Pendiente'
  },
  frecuenciaPago: {
    type: String,
    enum: ['Único', 'Mensual', 'Trimestral', 'Anual'],
    required: true
  },
  stripePaymentIntentId: String,
  stripeSubscriptionId: String
});

module.exports = mongoose.model('Transaction', TransactionSchema);
