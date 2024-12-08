const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainerClientChat',
        required: true
    },
    emisor: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'emisorModel',
        required: true
    },
    emisorModel: {
        type: String,
        required: true,
        enum: ['Trainer', 'Client']
    },
    receptor: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'receptorModel',
        required: true
    },
    receptorModel: {
        type: String,
        required: true,
        enum: ['Trainer', 'Client']
    },
    contenido: {
        type: String,
        required: true,
        trim: true
    },
    tipo: {
        type: String,
        enum: ['texto', 'imagen', 'archivo'],
        default: 'texto'
    },
    urlArchivo: {
        type: String,
        default: null
    },
    leido: {
        type: Boolean,
        default: false
    },
    fechaEnvio: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índices para mejorar las consultas
messageSchema.index({ conversacion: 1, fechaEnvio: -1 });
messageSchema.index({ emisor: 1, receptor: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
