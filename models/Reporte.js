const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema({
  idTicket: {
    type: String,
    required: true,
    unique: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  resumenFeedback: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Bug', 'Request', 'UI', 'Performance']
  },
  seccion: {
    type: String,
    required: true,
    enum: [
      'Dashboard', 'Clientes', 'Rutinas', 'Dietas', 'Clases',
      'Economía', 'Marketing/Campañas', 'Marketing/Análisis',
      'Contenido', 'Publicaciones', 'Perfil', 'Ajustes',
      'Servicios', 'Reportes'
    ]
  },
  estado: {
    type: String,
    required: true,
    enum: ['Abierto', 'En Progreso', 'Resuelto', 'Cerrado'],
    default: 'Abierto'
  },
  departamentoAsignado: {
    type: String,
    required: true,
    enum: ['TI', 'Servicio al Cliente', 'Desarrollo', 'Ventas', 'Marketing']
  },
  fechaRecibido: {
    type: Date,
    default: Date.now
  },
  ultimaActualizacion: {
    type: Date,
    default: Date.now
  },
  resumenResolucion: {
    type: String,
    default: ''
  },
  usuarioNotificado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reporte', reporteSchema);
