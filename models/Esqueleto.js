const mongoose = require('mongoose');

const SetRenderSchema = new mongoose.Schema({
  campo1: { type: String, default: 'reps', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] },
  campo2: { type: String, default: 'weight', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] },
  campo3: { type: String, default: 'rest', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] }
});

const SetSchema = new mongoose.Schema({
  // Campos básicos
  reps: { type: Number, alias: 'repeticiones' },
  weight: { 
    type: Number, 
    alias: 'peso',
    min: 0
  },
  weightType: {
    type: String,
    enum: ['absolute', 'rmPercentage'],
    default: 'absolute'
  },
  rmPercentage: {
    type: Number,
    min: 0,
    max: 100,
    validate: {
      validator: function(v) {
        return this.weightType === 'absolute' || (v >= 0 && v <= 100);
      },
      message: 'El porcentaje de RM debe estar entre 0 y 100'
    }
  },
  rest: { type: Number, alias: 'descanso' },
  
  // Campos adicionales
  tempo: { type: String, alias: 'ritmo' },
  rpe: { type: Number, min: 0, max: 10, alias: 'esfuerzoPercibido' },
  rpm: { type: Number, min: 0, alias: 'revolucionesPorMinuto' },
  rir: { type: Number, min: 0, alias: 'repeticionesEnReserva' },
  speed: { type: Number, min: 0, alias: 'velocidad' },
  cadence: { type: Number, min: 0, alias: 'cadencia' },
  distance: { type: Number, min: 0, alias: 'distancia' },
  height: { type: Number, min: 0, alias: 'altura' },
  calories: { type: Number, min: 0, alias: 'calorias' },
  round: { type: Number, min: 1, alias: 'ronda' },

  // Campo de renderizado
  renderConfig: { type: SetRenderSchema, default: () => ({}) },

  // Campo de estado
  completed: { type: Boolean, default: false },
  
  // Campos de auditoría
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware para actualizar updatedAt
SetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ExerciseWithSetsSchema = new mongoose.Schema({
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  sets: [SetSchema],
  order: { type: Number, required: true } // Para mantener el orden de los ejercicios en la sesión
});

const SessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tipo: { 
    type: String, 
    required: true,
    enum: ['Normal', 'Superset']
  },
  rondas: { 
    type: Number,
    min: [1, 'El número de rondas debe ser al menos 1'],
    default: 1
  },
  exercises: [ExerciseWithSetsSchema],
  order: { type: Number, required: true } // Para mantener el orden de las sesiones en la variante
});

// Middleware para validar que no haya ejercicios duplicados en una sesión
SessionSchema.pre('save', function(next) {
  const exerciseIds = this.exercises.map(e => e.exercise.toString());
  const uniqueExercises = new Set(exerciseIds);
  if (uniqueExercises.size !== exerciseIds.length) {
    next(new Error('No puede haber ejercicios duplicados en la misma sesión'));
    return;
  }
  next();
});

const VariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: {
    type: String,
    enum: ['rojo', 'verde', 'amarillo', 'vacío'],
    required: true,
  },
  sessions: [SessionSchema]
});

// Middleware para validar que no haya sesiones duplicadas en una variante
VariantSchema.pre('save', function(next) {
  const sessionNames = this.sessions.map(s => s.name);
  const uniqueSessions = new Set(sessionNames);
  if (uniqueSessions.size !== sessionNames.length) {
    next(new Error('No puede haber sesiones duplicadas en la misma variante'));
    return;
  }
  next();
});

const DayPlanSchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  variants: [VariantSchema]
});

const WeekPlanSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  days: [DayPlanSchema]
});

const EsqueletoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  semanas: { type: Number, required: true },
  plan: [WeekPlanSchema],
  plannings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Planning' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware para validar la estructura completa
EsqueletoSchema.pre('save', function(next) {
  // Verificar semanas duplicadas
  const weekNumbers = this.plan.map(w => w.weekNumber);
  if (new Set(weekNumbers).size !== weekNumbers.length) {
    next(new Error('No puede haber números de semana duplicados'));
    return;
  }

  // Verificar días duplicados en cada semana
  for (const week of this.plan) {
    const dayNumbers = week.days.map(d => d.dayNumber);
    if (new Set(dayNumbers).size !== dayNumbers.length) {
      next(new Error(`La semana ${week.weekNumber} tiene números de día duplicados`));
      return;
    }
  }

  next();
});

module.exports = mongoose.model('Esqueleto', EsqueletoSchema);
