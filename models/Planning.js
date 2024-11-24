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
  reps: { type: Number, required: true },
  weight: { type: Number, required: true },
  rest: { type: Number, required: true }, // Tiempo de descanso en segundos
  checkIns: [{ type: Schema.Types.ObjectId, ref: 'CheckIn' }],
}, { timestamps: true });

const Set = mongoose.model('Set', SetSchema);

// 5. Exercise Schema
const ExerciseSchema = new Schema({
  name: { type: String, required: true },
  sets: [{ type: Schema.Types.ObjectId, ref: 'Set' }],
}, { timestamps: true });

const Exercise = mongoose.model('Exercise', ExerciseSchema);

// 6. Session Schema
const SessionSchema = new Schema({
  name: { type: String, required: true },
  exercises: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
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
    cliente: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    trainer: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
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
  Exercise,
  Session,
  DayPlan,
  WeekPlan,
  Planning,
};
