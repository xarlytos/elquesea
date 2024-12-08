// models/Cuestionario.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Esquema para las Opciones
const OpcionSchema = new Schema({
  texto: { type: String, required: true },
  valor: { type: String, required: true }
});

// Esquema para las Preguntas
const PreguntaSchema = new Schema({
  texto: { type: String, required: true },
  categoria: { type: String, required: true },
  tipo: { type: String, required: true, enum: ['texto', 'numero', 'opciones', 'boolean'] },
  opciones: { 
    type: [OpcionSchema],
    required: function() { return this.tipo === 'opciones'; },
    validate: {
      validator: function(v) {
        return this.tipo !== 'opciones' || (v && v.length > 0);
      },
      message: 'Las preguntas de tipo opciones deben tener al menos una opción'
    }
  }
});

// Modelo Cuestionario
const Cuestionario = mongoose.models.Cuestionario || mongoose.model('Cuestionario', new Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  frecuencia: {
    type: String,
    enum: ['diario', 'semanal', 'quincenal', 'mensual', 'trimestral', 'antes de entrenar', 'después de entrenar', 'después de comer'],
    required: true,
  },
  preguntas: { type: [PreguntaSchema], required: true },
  fechaCreacion: { type: Date, default: Date.now },
  estado: {
    type: String,
    enum: ['activo', 'pendiente', 'completado'],
    default: 'activo',
  },
  clientes: { type: [{ type: Schema.Types.ObjectId, ref: 'Client' }], default: [] },
  entrenador: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  lastUpdate: { type: Date, default: Date.now },
  responses: { type: Number, default: 0 },
  completion: { type: String, default: '0%' },
}));

module.exports = Cuestionario;
