const mongoose = require('mongoose');

const bonoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del bono es requerido'],
        trim: true
    },
    clienteId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Client',
        required: [true, 'El cliente es requerido']
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de bono es requerido'],
        enum: ['mensual', 'trimestral', 'anual', 'sesiones'],
        trim: true
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true
    },
    primeraFecha: {
        type: Date,
        required: [true, 'La primera fecha es requerida']
    },
    segundaFecha: {
        type: Date,
        required: [true, 'La segunda fecha es requerida']
    },
    terceraFecha: {
        type: Date,
        required: [true, 'La tercera fecha es requerida']
    },
    servicio: {
        type: String,
        required: [true, 'El servicio es requerido'],
        trim: true
    },
    sesiones: {
        type: Number,
        required: [true, 'El número de sesiones es requerido'],
        min: [0, 'El número de sesiones no puede ser negativo']
    },
    precio: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativo']
    },
    trainer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Trainer',
        required: [true, 'El trainer es requerido']
    },
    estado: {
        type: String,
        enum: ['activo', 'usado', 'expirado', 'cancelado'],
        default: 'activo'
    },
    sesionesRestantes: {
        type: Number,
        default: function() {
            return this.sesiones;
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware para validar fechas
bonoSchema.pre('save', function(next) {
    if (this.segundaFecha <= this.primeraFecha) {
        next(new Error('La segunda fecha debe ser posterior a la primera fecha'));
    }
    if (this.terceraFecha <= this.segundaFecha) {
        next(new Error('La tercera fecha debe ser posterior a la segunda fecha'));
    }
    next();
});

// Middleware para actualizar estado basado en fechas
bonoSchema.pre('save', function(next) {
    const now = new Date();
    if (now > this.terceraFecha) {
        this.estado = 'expirado';
    }
    if (this.sesionesRestantes === 0) {
        this.estado = 'usado';
    }
    next();
});

module.exports = mongoose.model('Bono', bonoSchema);
