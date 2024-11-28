const mongoose = require('mongoose');

const otrosDocumentosSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del documento es requerido'],
        trim: true
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de documento es requerido'],
        trim: true
    },
    fechaCreacion: {
        type: Date,
        required: [true, 'La fecha de creación es requerida'],
        default: Date.now
    },
    fechaFinalizacion: {
        type: Date,
        required: false
    },
    trainer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Trainer',
        required: false
    },
    notas: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('OtrosDocumentos', otrosDocumentosSchema);
