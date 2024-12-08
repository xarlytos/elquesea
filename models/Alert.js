// models/Alert.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AlertSchema = new Schema({
  type: {
    type: String,
    enum: ['email', 'push', 'sms', 'popup'],
    default: 'popup',
    required: true
  },
  timeBeforeEvent: {
    type: Number,
    default: 30,
    required: true,
    min: 1 // Mínimo 1 minuto antes
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  },
  recipient: {
    type: Schema.Types.Mixed, // Puede ser un email, número de teléfono, o ID de dispositivo
    required: true
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  sentAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar updatedAt
AlertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para marcar la alerta como enviada
AlertSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = Date.now();
  return this.save();
};

// Método para marcar la alerta como fallida
AlertSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.message = errorMessage || 'Failed to send alert';
  return this.save();
};

// Método para cancelar la alerta
AlertSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Índices para mejorar el rendimiento de las consultas
AlertSchema.index({ event: 1, status: 1 });
AlertSchema.index({ status: 1, timeBeforeEvent: 1 });

const Alert = mongoose.model('Alert', AlertSchema);

module.exports = Alert;
