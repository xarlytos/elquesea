const mongoose = require('mongoose');

const SetRenderSchema = new mongoose.Schema({
  campo1: { type: String, default: 'reps', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] },
  campo2: { type: String, default: 'weight', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] },
  campo3: { type: String, default: 'rest', enum: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'] }
});

const SetSchema = new mongoose.Schema({
  campo1: { type: mongoose.Schema.Types.Mixed },
  campo2: { type: mongoose.Schema.Types.Mixed },
  campo3: { type: mongoose.Schema.Types.Mixed }
}, { _id: false, strict: false });

const ExerciseWithSetsSchema = new mongoose.Schema({
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  sets: [SetSchema],
  config: { type: SetRenderSchema }
}, { _id: false });

const VariantItemSchema = new mongoose.Schema({
  color: { type: String, required: true },
  exercises: [ExerciseWithSetsSchema]
}, { _id: false });

const DayVariantsSchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true, min: 1, max: 7 },
  variants: [VariantItemSchema]
}, { _id: false });

const PeriodoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  semanaInicio: { type: Number, required: true, min: 1 },
  diaInicio: { type: Number, required: true, min: 1, max: 7 },
  semanaFin: { type: Number, required: true, min: 1 },
  diaFin: { type: Number, required: true, min: 1, max: 7 },
  variants: [DayVariantsSchema]
}, { _id: false });

// Middleware para validar que la fecha de fin no sea anterior a la de inicio
PeriodoSchema.pre('save', function(next) {
  if (this.semanaFin < this.semanaInicio || 
      (this.semanaFin === this.semanaInicio && this.diaFin < this.diaInicio)) {
    next(new Error('La fecha de fin no puede ser anterior a la fecha de inicio'));
    return;
  }
  next();
});

const EsqueletoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  periodos: [PeriodoSchema],
  plannings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Planning' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware para validar que los periodos no se solapen
EsqueletoSchema.pre('save', function(next) {
  const periodos = this.periodos;
  for (let i = 0; i < periodos.length; i++) {
    for (let j = i + 1; j < periodos.length; j++) {
      const periodo1 = periodos[i];
      const periodo2 = periodos[j];
      
      // Convertir semanas y días a un número total de días para comparación
      const inicio1 = periodo1.semanaInicio * 7 + periodo1.diaInicio;
      const fin1 = periodo1.semanaFin * 7 + periodo1.diaFin;
      const inicio2 = periodo2.semanaInicio * 7 + periodo2.diaInicio;
      const fin2 = periodo2.semanaFin * 7 + periodo2.diaFin;
      
      if ((inicio1 <= fin2 && fin1 >= inicio2) || 
          (inicio2 <= fin1 && fin2 >= inicio1)) {
        next(new Error(`Los periodos ${periodo1.nombre} y ${periodo2.nombre} se solapan`));
        return;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Esqueleto', EsqueletoSchema);
