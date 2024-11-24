const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  number: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'EUR', 'MXN'], required: true },
  issueDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  ],
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }, // Servicio vinculado
  notes: { type: String },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
});

module.exports = mongoose.model('Invoice', invoiceSchema);
