const mongoose = require('mongoose');
const { Schema } = mongoose;

// Modelo Service
const Service = mongoose.models.Service || mongoose.model('Service', new Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  tipo: {
    type: String,
    enum: ['Suscripción', 'Asesoría Individual', 'Clase Grupal', 'Pack de Citas', 'Servicio Adicional'],
    required: true,
  },
  entrenador: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  planesDePago: [{ type: Schema.Types.ObjectId, ref: 'PaymentPlan' }], // Cambiado a arreglo
  clientes: { type: [{ type: Schema.Types.ObjectId, ref: 'Client' }], default: [] },
  serviciosAdicionales: [{
    type: String,
    enum: ['Pack de Citas', 'Planificacion', 'Dietas'],
  }],
  sesiones: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
  ingresos: [{ type: Schema.Types.ObjectId, ref: 'Income' }], // Relación con Income
  planificaciones: [{ type: Schema.Types.ObjectId, ref: 'Planning' }], // Relación con Planning
  dietas: [{ type: Schema.Types.ObjectId, ref: 'Dieta' }], // Relación con Dieta
  fechaCreacion: { type: Date, default: Date.now },
}));

// Modelo PaymentPlan
const PaymentPlan = mongoose.models.PaymentPlan || mongoose.model('PaymentPlan', new Schema({
  nombre: { type: String, required: true }, // Campo nuevo
  precio: { type: Number, required: true },
  moneda: { type: String, default: 'EUR' },
  frecuencia: {
    type: String,
    enum: ['Único', 'Mensual', 'Trimestral', 'Anual'],
    required: true,
  },
  detalles: String,
  stripeProductId: String,
  stripePriceId: String,
  servicio: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  clientes: { type: [{ type: Schema.Types.ObjectId, ref: 'Client' }], default: [] },
  fechaCreacion: { type: Date, default: Date.now },
}));

module.exports = { Service, PaymentPlan };
