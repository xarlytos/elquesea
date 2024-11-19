const mongoose = require('mongoose');
const { Schema } = mongoose;

const ServiceSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  tipo: {
    type: String,
    enum: ['Suscripción', 'Asesoría Individual', 'Clase Grupal', 'Pack de Citas'],
    required: true
  },
  entrenador: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  planDePago: { type: Schema.Types.ObjectId, ref: 'PaymentPlan' },
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', ServiceSchema);
