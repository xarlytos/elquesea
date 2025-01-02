const mongoose = require('mongoose');
const { Schema } = mongoose;

// Subesquema para las redes sociales
const socialMediaSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter'],
    required: true
  },
  username: {
    type: String,
    required: true
  }
});

// Subesquema para los tags
const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  }
});

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
    enum: ['general', 'training', 'diet', 'medical', 'General'],
    default: 'General'
  }
});

// Subesquema para la dirección
const direccionSchema = new mongoose.Schema({
  calle: {
    type: String,
    default: ''
  },
  numero: {
    type: String,
    default: ''
  },
  piso: {
    type: String,
    default: ''
  },
  codigoPostal: {
    type: String,
    default: ''
  },
  ciudad: {
    type: String,
    default: ''
  },
  provincia: {
    type: String,
    default: ''
  }
});

const ClientSchema = new Schema({
  // Información básica
  nombre: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    unique: true, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  fechaNacimiento: { 
    type: Date 
  },
  enviarFelicitacionCumple: {
    type: Boolean,
    default: false
  },
  genero: {
    type: String,
    enum: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo']
  },
  telefono: {
    type: String
  },

  // Información de contacto y redes sociales
  direccion: { 
    type: direccionSchema, 
    default: () => ({}) 
  },
  redesSociales: [socialMediaSchema],

  // Información de pago y suscripción
  stripeCustomerId: {
    type: String,
    sparse: true
  },
  subscription: {
    id: String,
    status: {
      type: String,
      enum: ['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'paused']
    },
    priceId: String,
    currentPeriodEnd: Date
  },
  metodoPagoPredeterminado: {
    type: String,
    sparse: true
  },

  // Información fisiológica
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
  condicionesMedicas: [{
    type: String
  }],

  // Nivel de actividad y estado
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

  // Tags y notas
  tags: [tagSchema],
  notas: [notaSchema],

  // Referencias a otros modelos
  trainer: { 
    type: Schema.Types.ObjectId, 
    ref: 'Trainer', 
    required: true 
  },
  planesDePago: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'PaymentPlan' 
  }],
  servicios: { 
    type: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Service' 
    }], 
    default: [] 
  },
  transacciones: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Transaction' 
  }],
  eventos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  plannings: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Planning' 
  }],
  planningActivo: { 
    type: Schema.Types.ObjectId, 
    ref: 'Planning' 
  },
  dietas: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Dieta' 
  }],
  dietaActiva: { 
    type: Schema.Types.ObjectId, 
    ref: 'Dieta' 
  },

  // Campos de auditoría
  fechaRegistro: { 
    type: Date, 
    default: Date.now 
  }
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

// Middleware para enviar email de bienvenida después de crear un cliente
ClientSchema.post('save', async function(doc) {
  if (this.isNew) { // Solo si es un nuevo cliente
    try {
      const axios = require('axios');
      await axios.post('http://localhost:3000/api/email/welcome', {
        clientId: doc._id
      }, {
        headers: {
          'Authorization': `Bearer ${doc.trainer.token}` // Asumiendo que el trainer tiene un token
        }
      });
    } catch (error) {
      console.error('Error al enviar email de bienvenida:', error);
      // No lanzamos el error para evitar que afecte al guardado del cliente
    }
  }
});

module.exports = mongoose.model('Client', ClientSchema);
