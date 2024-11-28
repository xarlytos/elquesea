const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del contrato es requerido'],
        trim: true
    },
    fechaInicio: {
        type: Date,
        required: [true, 'La fecha de inicio es requerida']
    },
    fechaFin: {
        type: Date,
        required: [true, 'La fecha de fin es requerida'],
        validate: {
            validator: function(value) {
                return value > this.fechaInicio;
            },
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        }
    },
    estado: {
        type: String,
        enum: ['Activo', 'Finalizado', 'Cancelado', 'Pendiente'],
        default: 'Pendiente'
    },
    trainer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Trainer',
        required: false
    },
    cliente: {
        type: mongoose.Schema.ObjectId,
        ref: 'Client',
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
contractSchema.pre('save', function(next) {
    const now = new Date();
    if (now > this.fechaFin) {
        this.estado = 'Finalizado';
    } else if (now >= this.fechaInicio && now <= this.fechaFin) {
        this.estado = 'Activo';
    }
    next();
});

module.exports = mongoose.model('Contract', contractSchema);
