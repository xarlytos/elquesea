const mongoose = require('mongoose');
const { Schema } = mongoose;

// Subesquema para las notas
const notaSchema = new mongoose.Schema({
  texto: {
    type: String,
    required: [true, 'El texto de la nota es obligatorio']
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  categoria: {
    type: String,
    enum: ['general', 'training', 'nutricion', 'otro', 'General'],
    default: 'General'
  }
});

// Subesquema para la dirección
const direccionSchema = new mongoose.Schema({
  calle: {
    type: String,
    required: [true, 'La calle es obligatoria']
  },
  numero: {
    type: String
  },
  piso: {
    type: String
  },
  codigoPostal: {
    type: String
  },
  ciudad: {
    type: String,
    required: [true, 'La ciudad es obligatoria']
  },
  provincia: {
    type: String,
    required: [true, 'La provincia es obligatoria']
  }
});

const ClientSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Encriptar antes de guardar
  planesDePago: [{ type: Schema.Types.ObjectId, ref: 'PaymentPlan' }],
  servicios: { type: [{ type: Schema.Types.ObjectId, ref: 'Service' }], default: [] },

  transacciones: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  fechaRegistro: { type: Date, default: Date.now },
  trainer: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true }, // Referencia al entrenador
  altura: {
    type: Number,
    min: [0, 'La altura debe ser mayor que 0'],
    max: [300, 'La altura debe ser menor que 300']
  },
  peso: {
    type: Number,
    min: [0, 'El peso debe ser mayor que 0'],
    max: [500, 'El peso debe ser menor que 500']
  },
  nivelActividad: {
    type: String,
    enum: ['Sedentario', 'Ligero', 'Moderado', 'Activo', 'Muy Activo'],
    default: 'Moderado'
  },
  estado: {
    type: String,
    enum: ['Activo', 'Inactivo', 'Pendiente', 'Suspendido'],
    default: 'Pendiente'
  },
  direccion: direccionSchema,
  notas: [notaSchema], // Agregando el array de notas al esquema del cliente
  eventos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  plannings: [{ type: Schema.Types.ObjectId, ref: 'Planning' }],
  planningActivo: { type: Schema.Types.ObjectId, ref: 'Planning' },
  dietas: [{ type: Schema.Types.ObjectId, ref: 'Dieta' }],
  dietaActiva: { type: Schema.Types.ObjectId, ref: 'Dieta' }
}, {
  timestamps: true
});

// Middleware para poblar automáticamente el planning activo
ClientSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'planningActivo',
    select: 'nombre descripcion fechaInicio meta semanas'
  });
  this.populate('dietaActiva');
  next();
});

module.exports = mongoose.model('Client', ClientSchema);
