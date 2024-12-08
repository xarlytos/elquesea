// models/Event.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const alertSchema = new Schema({
  type: {
    type: String,
    enum: ['email', 'push', 'sms', 'popup'],
    default: 'popup'
  },
  timeBeforeEvent: {
    type: Number, // Ej: minutos u horas antes del evento
    default: 30
  }
});

const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  type: {
    type: String,
    enum: ['TAREA_PROPIA', 'CITA_CON_CLIENTE', 'RUTINA_CLIENTE', 'PAGO_CLIENTE', 'ALARMA', 'GENERAL'],
    default: 'GENERAL'
  },
  origin: {
    type: String,
    enum: ['PROPIO', 'CLIENTE'],
    default: 'PROPIO'
  },
  isWorkRelated: { type: Boolean, default: true },

  // Referencias a otros modelos
  trainer: { type: Schema.Types.ObjectId, ref: 'Trainer' },
  client: { type: Schema.Types.ObjectId, ref: 'Client' },
  relatedService: { type: Schema.Types.ObjectId, ref: 'Service' },
  relatedPaymentPlan: { type: Schema.Types.ObjectId, ref: 'PaymentPlan' },
  relatedRoutinePlan: { type: Schema.Types.ObjectId, ref: 'Planning' },

  alerts: [alertSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
