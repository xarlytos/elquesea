const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mantenemos los schemas básicos de Set y Render
const SetRenderSchema = new Schema({
  campo1: { type: String, default: 'reps', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] },
  campo2: { type: String, default: 'weight', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] },
  campo3: { type: String, default: 'rest', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] }
});

const TemplateSetSchema = new Schema({
  reps: { type: Number, alias: 'repeticiones' },
  weight: { type: Number, alias: 'peso' },
  rest: { type: Number, alias: 'descanso' },
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
  renderConfig: { type: SetRenderSchema, default: () => ({}) }
});

const TemplateExerciseSchema = new Schema({
  exercise: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  sets: [TemplateSetSchema]
});

const TemplateSessionSchema = new Schema({
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
  exercises: [TemplateExerciseSchema]
});

const TemplateDaySchema = new Schema({
  dayNumber: { type: Number, required: true }, // 1-7 representando los días de la semana
  sessions: [TemplateSessionSchema]
});

const TemplateWeekSchema = new Schema({
  weekNumber: { type: Number, required: true },
  days: [TemplateDaySchema]
});

// Schema para los clientes asignados a la plantilla
const AssignedClientSchema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  assignedDate: { type: Date, default: Date.now },
  currentWeek: { type: Number, default: 1 },
  currentDay: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  modifications: [{
    weekNumber: Number,
    dayNumber: Number,
    sessionIndex: Number,
    exerciseIndex: Number,
    setIndex: Number,
    field: String,
    originalValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    modifiedAt: { type: Date, default: Date.now }
  }]
});

// Schema principal de la plantilla
const PlanningTemplateSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es requerida']
  },
  trainer: {
    type: Schema.Types.ObjectId,
    ref: 'Trainer',
    required: [true, 'El trainer es requerido']
  },
  meta: {
    type: String,
    required: [true, 'La meta es requerida'],
    enum: ['Cardio', 'Fuerza', 'Hipertrofia', 'Resistencia', 'Movilidad', 'Coordinación', 'Definición', 'Recomposición', 'Rehabilitación', 'Otra']
  },
  otraMeta: {
    type: String,
    required: function() {
      return this.meta === 'Otra';
    }
  },
  semanas: {
    type: Number,
    required: [true, 'El número de semanas es requerido'],
    min: [1, 'Debe haber al menos 1 semana']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  plan: [{
    weekNumber: Number,
    days: [{
      dayNumber: Number,
      sessions: [{
        nombre: String,
        descripcion: String,
        exercises: [{
          exercise: {
            type: Schema.Types.ObjectId,
            ref: 'Exercise'
          },
          orden: Number,
          sets: [{
            tipo: {
              type: String,
              enum: ['normal', 'dropset', 'superset'],
              default: 'normal'
            },
            repeticiones: Number,
            peso: Number,
            tiempo: Number,
            descanso: Number,
            notas: String
          }],
          notas: String
        }]
      }]
    }]
  }],
  assignedClients: [{
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    customExercises: [{
      originalExercise: {
        type: Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      replacementExercise: {
        type: Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      weekNumber: Number,
      dayNumber: Number,
      sessionIndex: Number,
      exerciseIndex: Number
    }]
  }]
}, {
  timestamps: true
});

// Middleware para validar que no haya números de semana o día duplicados
PlanningTemplateSchema.pre('save', function(next) {
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

// Método para clonar una plantilla
PlanningTemplateSchema.methods.clone = function(newName) {
  const clone = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    nombre: newName,
    assignedClients: [],
    createdAt: undefined,
    updatedAt: undefined
  });
  return clone.save();
};

// Método para asignar un cliente
PlanningTemplateSchema.methods.assignClient = function(clientId) {
  if (this.assignedClients.some(ac => ac.client.toString() === clientId.toString())) {
    throw new Error('El cliente ya está asignado a esta plantilla');
  }
  
  this.assignedClients.push({
    client: clientId,
    assignedAt: Date.now,
    customExercises: []
  });
  
  return this.save();
};

// Método para modificar un ejercicio específico para un cliente
PlanningTemplateSchema.methods.modifyClientExercise = function(clientId, weekNumber, dayNumber, sessionIndex, exerciseIndex, setIndex, modifications) {
  const clientAssignment = this.assignedClients.find(
    ac => ac.client.toString() === clientId.toString()
  );

  if (!clientAssignment) {
    throw new Error('Cliente no encontrado en esta plantilla');
  }

  Object.entries(modifications).forEach(([field, newValue]) => {
    clientAssignment.modifications.push({
      weekNumber,
      dayNumber,
      sessionIndex,
      exerciseIndex,
      setIndex,
      field,
      originalValue: this.plan[weekNumber-1].days[dayNumber-1].sessions[sessionIndex].exercises[exerciseIndex].sets[setIndex][field],
      newValue,
      modifiedAt: new Date()
    });
  });

  return this.save();
};

const PlanningTemplate = mongoose.model('PlanningTemplate', PlanningTemplateSchema);

module.exports = PlanningTemplate;
