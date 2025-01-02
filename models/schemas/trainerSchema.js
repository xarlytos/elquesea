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
    },
    googleAuth: {
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Date,
        isConnected: {
            type: Boolean,
            default: false
        }
    },
    instagramAuth: {
        accessToken: String,
        userId: String,
        username: String,
        tokenExpiry: Date,
        isConnected: {
            type: Boolean,
            default: false
        }
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

// Método para actualizar tokens de Google
trainerSchema.methods.updateGoogleTokens = async function(tokens) {
    this.googleAuth = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || this.googleAuth?.refreshToken,
        tokenExpiry: new Date(Date.now() + (tokens.expires_in * 1000)),
        isConnected: true
    };
    await this.save();
};

// Método para verificar si los tokens están expirados
trainerSchema.methods.isGoogleTokenExpired = function() {
    if (!this.googleAuth?.tokenExpiry) return true;
    return new Date() >= this.googleAuth.tokenExpiry;
};

// Método para desconectar cuenta de Google
trainerSchema.methods.disconnectGoogle = async function() {
    this.googleAuth = {
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        isConnected: false
    };
    await this.save();
};

// Método para actualizar tokens de Instagram
trainerSchema.methods.updateInstagramTokens = async function(tokens) {
    this.instagramAuth = {
        accessToken: tokens.access_token,
        userId: tokens.user_id,
        username: tokens.username,
        tokenExpiry: new Date(Date.now() + (tokens.expires_in * 1000)),
        isConnected: true
    };
    await this.save();
};

// Método para verificar si el token de Instagram está expirado
trainerSchema.methods.isInstagramTokenExpired = function() {
    if (!this.instagramAuth?.tokenExpiry) return true;
    return new Date() >= this.instagramAuth.tokenExpiry;
};

// Método para desconectar cuenta de Instagram
trainerSchema.methods.disconnectInstagram = async function() {
    this.instagramAuth = {
        accessToken: null,
        userId: null,
        username: null,
        tokenExpiry: null,
        isConnected: false
    };
    await this.save();
};

module.exports = trainerSchema;
