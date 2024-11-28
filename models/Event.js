const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Workshop', 'Webinar', 'Meeting', 'Training'], // Ejemplo de tipos
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  trainer: {
    type: Schema.Types.ObjectId,
    ref: 'Trainer',
    required: false,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: false,
  },
  lead: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: false,
  },
}, {
  timestamps: true, // Para createdAt y updatedAt
});

module.exports = mongoose.model('Event', eventSchema);
