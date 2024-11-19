// models/Exercise.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExerciseSchema = new Schema({
  nombre: { type: String, required: true },
  tipo: String,
  grupoMuscular: [String],
  descripcion: String,
  equipo: String,
  imgUrl: String,
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exercise', ExerciseSchema);
