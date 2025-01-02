const mongoose = require('mongoose');

// Verificar si el modelo ya existe antes de definirlo
const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['new', 'interested', 'not interested'],
    default: 'new',
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
  },
  origen: {
    type: String,
    required: false,
    enum: ['web', 'referral', 'social media', 'other'],
    default: 'other',
  },
});

const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

module.exports = Lead;
