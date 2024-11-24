// models/Dieta.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Esquema de Ingrediente
const IngredienteSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  calorias: {
    type: Number,
    required: true,
  },
  proteinas: {
    type: Number,
    required: true,
  },
  carbohidratos: {
    type: Number,
    required: true,
  },
  grasas: {
    type: Number,
    required: true,
  },
}, { _id: false });

// Esquema de Comida
const ComidaSchema = new Schema({
  numero: {
    type: Number,
    required: true,
  },
  peso: { // Peso en gramos o la unidad que desees
    type: Number,
    required: true,
  },
  ingredientes: {
    type: [IngredienteSchema],
    required: true,
  },
}, { _id: false });

// Esquema de Día
const DiaSchema = new Schema({
  fecha: { // Fecha específica del día
    type: Date,
    required: true,
  },
  restricciones: {
    calorias: { type: Number, required: true },
    proteinas: { type: Number, required: true },
    carbohidratos: { type: Number, required: true },
    grasas: { type: Number, required: true },
  },
  comidas: {
    type: [ComidaSchema],
    required: true,
    // Eliminamos la validación para la cantidad de comidas
  },
}, { _id: false });

// Esquema de Semana
const SemanaSchema = new Schema({
  idSemana: { // Identificador de la semana (opcional)
    type: Number,
    required: true,
  },
  fechaInicio: { // Fecha de inicio de la semana
    type: Date,
    required: true,
  },
  dias: {
    type: [DiaSchema],
    required: true,
    validate: [diasLimit, 'Cada semana debe tener exactamente 7 días'],
  },
}, { _id: false });

// Función de validación para días
function diasLimit(val) {
  return val.length === 7;
}

// Esquema de Dieta
const DietaSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  cliente: { // Referencia al modelo Client
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  trainer: { // Referencia al modelo Trainer
    type: Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true,
  },
  fechaInicio: {
    type: Date,
    required: true,
  },
  objetivo: {
    type: String,
    required: true,
  },
  restricciones: {
    type: String, // Puedes detallar más si es necesario
    required: true,
  },
  estado: {
    type: String,
    enum: ['activa', 'inactiva', 'completada'], // Ejemplos de estados
    default: 'activa',
  },
  fechaComienzo: {
    type: Date,
    required: true,
  },
  semanas: {
    type: [SemanaSchema],
    required: true,
  },
}, {
  timestamps: true, // Opcional: para crear campos createdAt y updatedAt
});

module.exports = mongoose.model('Dieta', DietaSchema);
