// models/PaymentPlan.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentPlanSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio']
  },
  moneda: {
    type: String,
    default: 'EUR'
  },
  frecuencia: {
    type: String,
    enum: ['Único', 'Mensual', 'Trimestral', 'Anual'],
    required: [true, 'La frecuencia es obligatoria']
  },
  duracion: {
    type: Number,
    required: [true, 'El número de pagos es obligatorio'],
    min: 1,
    validate: {
      validator: function(v) {
        // Para pagos únicos, solo se permite duración 1
        if (this.frecuencia === 'Único' && v !== 1) {
          return false;
        }
        return true;
      },
      message: props => 'Para pagos únicos, la duración debe ser 1'
    }
  },
  detalles: String,
  servicio: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'El servicio es obligatorio']
  },
  entrenador: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El entrenador es obligatorio']
  },
  clientes: [{ type: Schema.Types.ObjectId, ref: 'Client' }],
  stripeProductId: String,
  stripePriceId: String,
  activo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Evitar la recompilación del modelo si ya existe
module.exports = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', PaymentPlanSchema);
