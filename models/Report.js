const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    reportType: { type: String, enum: ['progreso', 'ventas', 'actividad'], required: true },
    createdAt: { type: Date, default: Date.now },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: false },
    attachedFiles: [{ type: String }], // URLs or file paths
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'trainer', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    status: { type: String, enum: ['generado', 'en revisión', 'finalizado'], default: 'generado' },
});

module.exports = mongoose.model('Report', reportSchema);
