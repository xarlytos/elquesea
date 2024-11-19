const mongoose = require('mongoose');
const { Schema } = mongoose;

// Esquema para los Sets (igual que antes)
const SetSchema = new Schema({
  set: Number,
  reps: String,
  percent: String,
  rest: String,
  notes: String,
  adjusted_1RM: Number,
  checkin: {
    type: Map,
    of: Schema.Types.Mixed
  }
});

// Esquema para los Ejercicios en el Plan de Entrenamiento
const ExercisePlanSchema = new Schema({
  ejercicio: { type: Schema.Types.ObjectId, ref: 'Exercise' },
  sets: [SetSchema]
});

// Esquema unificado de Sesión
const SessionSchema = new Schema({
  id: String,
  nombre: String, // Nombre de la sesión o actividad
  tipo: String,    // Tipo de la sesión (por ejemplo, "Fuerza", "Cardio")
  modo: String,    // Modo de entrenamiento (por ejemplo, "Individual", "Circuito")
  ejercicios: [ExercisePlanSchema]
});

// Esquema para los Días
const DaySchema = new Schema({
  id: String,
  nombre: String,
  sesiones: [SessionSchema]
});

// Esquema para las Semanas
const WeekSchema = new Schema({
  id: String,
  nombre: String,
  dias: [DaySchema]
});

// Esquema principal del Plan de Entrenamiento
const PlanEntrenamientoSchema = new Schema({
  nombre: String,
  descripcion: String,
  creador: { type: Schema.Types.ObjectId, ref: 'Trainer' }, // Modificado para referenciar al entrenador
  duracion: String,
  fechaInicio: Date,
  meta: String,
  cliente: { type: Schema.Types.ObjectId, ref: 'Client' }, // Asegurarse de que el modelo 'Client' está correcto
  semanas: [WeekSchema]
});

module.exports = mongoose.model('PlanEntrenamiento', PlanEntrenamientoSchema);
