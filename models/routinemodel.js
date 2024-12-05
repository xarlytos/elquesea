const mongoose = require('mongoose');
const { Schema } = mongoose;

// Definición de esquemas
const MetricSchema = new Schema({
    type: { type: String, required: true },
    value: { type: String, required: true }
});

const ExerciseSchema = new Schema({
    name: { type: String, required: true },
    metrics: [MetricSchema],
    notes: { type: String }
});

const RoutineSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    tags: [{ type: String }],
    notes: { type: String },
    exercises: [ExerciseSchema],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Creación del modelo
const Routine = mongoose.model('Routine', RoutineSchema);

module.exports = Routine;
