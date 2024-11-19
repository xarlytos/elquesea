// models/Chat.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatSchema = new Schema({
  trainer: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  conversation: [
    {
      role: { type: String, enum: ['trainer', 'assistant'], required: true }, // 'trainer' para el usuario, 'assistant' para ChatGPT
      message: { type: String, required: true },
      tokens: { type: Number, required: true }, // Almacena los tokens usados en cada mensaje
      timestamp: { type: Date, default: Date.now }
    }
  ],
  totalTokens: { type: Number, default: 0 }, // Total de tokens para la conversación
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);
