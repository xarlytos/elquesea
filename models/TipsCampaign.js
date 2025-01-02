const mongoose = require('mongoose');
const { Schema } = mongoose;

const TipSchema = new Schema({
    contenido: {
        type: String,
        required: [true, 'El contenido del consejo es obligatorio']
    },
    orden: {
        type: Number,
        required: true
    },
    enviado: {
        type: Boolean,
        default: false
    },
    fechaEnvio: {
        type: Date
    }
});

const TipsCampaignSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la campaña es obligatorio']
    },
    descripcion: {
        type: String
    },
    trainer: {
        type: Schema.Types.ObjectId,
        ref: 'Trainer',
        required: true
    },
    clientes: [{
        type: Schema.Types.ObjectId,
        ref: 'Client'
    }],
    consejos: [TipSchema],
    estado: {
        type: String,
        enum: ['activa', 'pausada', 'completada', 'cancelada'],
        default: 'activa'
    },
    frecuencia: {
        type: String,
        enum: ['diaria', 'semanal'],
        default: 'diaria'
    },
    horaEnvio: {
        type: String,
        default: '09:00'  // Formato HH:mm
    },
    ultimoEnvio: {
        type: Date
    },
    fechaInicio: {
        type: Date,
        required: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TipsCampaign', TipsCampaignSchema);
