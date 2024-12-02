const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const trainerSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'Por favor ingrese su nombre']
    },
    email: {
        type: String,
        required: [true, 'Por favor ingrese su email'],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Por favor ingrese una contraseña'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['trainer', 'admin'],
        default: 'trainer'
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Encriptar contraseña antes de guardar
trainerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Método para comparar contraseñas
trainerSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('Trainer', trainerSchema);
