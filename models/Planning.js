// src/models/planing.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// 3. CheckIn Schema
const CheckInSchema = new Schema({
  color: { type: String, required: true }, // Ejemplo: "#FF0000"
  comentario: { type: String, default: '' },
  fecha: { type: Date, default: Date.now },
}, { timestamps: true });

const CheckIn = mongoose.model('CheckIn', CheckInSchema);

// 4. Set Schema
const SetSchema = new Schema({
  // Campos básicos (no requeridos)
  reps: { type: Number, alias: 'repeticiones' },
  weight: { type: Number, alias: 'peso' },
  rest: { type: Number, alias: 'descanso' },
  
  // Campos adicionales (no requeridos)
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

  // Campo de estado
  completed: { type: Boolean, default: false },
  
  // Campos de auditoría
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  checkIns: [{ type: Schema.Types.ObjectId, ref: 'CheckIn' }],
}, { timestamps: true });

// Middleware para actualizar updatedAt
SetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Set = mongoose.model('Set', SetSchema);

// 5. Exercise Schema (ahora PlanningExercise para evitar conflictos)
const PlanningExerciseSchema = new Schema({
  exercise: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true }, // Referencia al modelo Exercise
  sets: [{ type: Schema.Types.ObjectId, ref: 'Set' }],
}, { timestamps: true });

const PlanningExercise = mongoose.model('PlanningExercise', PlanningExerciseSchema);

// 6. Session Schema
const SessionSchema = new Schema({
  name: { type: String, required: true },
  tipo: { 
    type: String, 
    required: true,
    enum: ['Normal', 'Superset']
  },
  rondas: { 
    type: Number,
    min: [1, 'El número de rondas debe ser al menos 1']
  },
  exercises: [{ type: Schema.Types.ObjectId, ref: 'PlanningExercise' }],
}, { timestamps: true });

const Session = mongoose.model('Session', SessionSchema);

// 7. DayPlan Schema
const DayPlanSchema = new Schema({
  day: { type: String, required: true }, // "Lunes", "Martes", etc.
  fecha: { type: Date, required: true }, // Fecha específica del día
  sessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
}, { timestamps: true });

const DayPlan = mongoose.model('DayPlan', DayPlanSchema);

// 8. WeekPlan Schema
const WeekPlanSchema = new Schema({
  weekNumber: { type: Number, required: true },
  startDate: { type: Date, required: true }, // Fecha de inicio de la semana (por ejemplo, lunes)
  days: {
    type: Map,
    of: { type: Schema.Types.ObjectId, ref: 'DayPlan' }, // Clave: "Lunes", "Martes", etc.
    required: true,
  },
}, { timestamps: true });

const WeekPlan = mongoose.model('WeekPlan', WeekPlanSchema);

// 9. Planning Schema
const PlanningSchema = new Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    fechaInicio: { type: Date, required: true },
    meta: { type: String, required: true },
    semanas: { type: Number, required: true, min: [1, 'Debe tener al menos una semana'] },
    plan: [{ type: Schema.Types.ObjectId, ref: 'WeekPlan' }],
    cliente: { type: Schema.Types.ObjectId, ref: 'Client' },
    trainer: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
    tipo: { 
      type: String, 
      required: true, 
      enum: ['Planificacion', 'Plantilla'],
      default: 'Planificacion'
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Middleware para actualizar `updatedAt` automáticamente
PlanningSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Planning = mongoose.model('Planning', PlanningSchema);

// Exportar todos los modelos
module.exports = {
  CheckIn,
  Set,
  PlanningExercise,
  Session,
  DayPlan,
  WeekPlan,
  Planning,
};
