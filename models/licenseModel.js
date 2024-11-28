const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    fechaExpiracion: {
        type: Date,
        required: [true, 'La fecha de expiración es requerida']
    },
    estado: {
        type: String,
        enum: ['Activa', 'Expirada', 'Suspendida', 'En Proceso'],
        default: 'Activa'
    },
    descripcion: {
        type: String,
        trim: true
    },
    campo: {
        type: String,
        required: [true, 'El campo de la licencia es requerido'],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('License', licenseSchema);
