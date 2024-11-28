const mongoose = require('mongoose');

const economicAlertSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la alerta es requerido'],
        trim: true
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de alerta es requerido'],
        enum: ['Vencimiento', 'Renovación', 'Pago Pendiente', 'Otro'],
        trim: true
    },
    fechaExpiracion: {
        type: Date,
        required: [true, 'La fecha de expiración es requerida']
    },
    fechaFinalizacion: {
        type: Date,
        default: function() {
            const fecha = new Date(this.fechaExpiracion);
            fecha.setDate(fecha.getDate() + 2);
            return fecha;
        }
    },
    estado: {
        type: String,
        enum: ['Activa', 'Finalizada', 'Cancelada'],
        default: 'Activa'
    },
    // Referencias a otros modelos
    contrato: {
        type: mongoose.Schema.ObjectId,
        ref: 'Contract',
        required: false
    },
    licencia: {
        type: mongoose.Schema.ObjectId,
        ref: 'License',
        required: false
    },
    otroDocumento: {
        type: mongoose.Schema.ObjectId,
        ref: 'OtrosDocumentos',
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

// Middleware para actualizar el estado automáticamente
economicAlertSchema.pre('save', function(next) {
    const now = new Date();
    if (now > this.fechaFinalizacion) {
        this.estado = 'Finalizada';
    }
    next();
});

module.exports = mongoose.model('EconomicAlert', economicAlertSchema);
