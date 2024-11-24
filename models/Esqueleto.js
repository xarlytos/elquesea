const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema({
  reps: Number,
  weight: Number,
  rest: Number,
});

const ExerciseVariantSchema = new mongoose.Schema({
  color: {
    type: String,
    enum: ['rojo', 'verde', 'amarillo', 'vacío'],
    required: true,
  },
  sets: [SetSchema],
});

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  variants: [ExerciseVariantSchema], // Variantes de sets por color
});

const SessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  exercises: [ExerciseSchema],
});

const DayPlanSchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true }, // Número representando el día (1 para el primer día, etc.)
  sessions: [SessionSchema],
});

const WeekPlanSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true }, // Número de la semana
  days: [DayPlanSchema],
});

const EsqueletoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  semanas: { type: Number, required: true }, // Número de semanas que abarca el esqueleto
  plan: [WeekPlanSchema], // Arreglo de semanas con su respectivo plan
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Esqueleto', EsqueletoSchema);
