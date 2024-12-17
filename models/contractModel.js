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
        required: [true, 'La fecha de fin es requerida']
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

// Middleware para validar fechas en actualizaciones
contractSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    
    // Si no hay fechas para actualizar, continuar
    if (!update.fechaInicio && !update.fechaFin) {
        return next();
    }

    try {
        let fechaInicio, fechaFin;

        // Obtener fechaInicio (de la actualización o del documento existente)
        if (update.fechaInicio) {
            fechaInicio = new Date(update.fechaInicio);
        }

        // Obtener fechaFin (de la actualización o del documento existente)
        if (update.fechaFin) {
            fechaFin = new Date(update.fechaFin);
        }

        // Si tenemos ambas fechas, validar
        if (fechaInicio && fechaFin) {
            console.log(' Validando fechas en middleware:', {
                fechaInicio: fechaInicio.toISOString(),
                fechaFin: fechaFin.toISOString(),
                diferenciaDias: Math.floor((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24))
            });

            if (fechaFin <= fechaInicio) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Middleware para validar fechas en nuevos documentos
contractSchema.pre('save', function(next) {
    if (this.fechaInicio && this.fechaFin) {
        const fechaInicio = new Date(this.fechaInicio);
        const fechaFin = new Date(this.fechaFin);

        console.log(' Validando fechas en nuevo contrato:', {
            fechaInicio: fechaInicio.toISOString(),
            fechaFin: fechaFin.toISOString(),
            diferenciaDias: Math.floor((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24))
        });

        if (fechaFin <= fechaInicio) {
            return next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
        }
    }
    next();
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
