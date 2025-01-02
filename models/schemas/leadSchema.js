const mongoose = require('mongoose');

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

module.exports = leadSchema;
