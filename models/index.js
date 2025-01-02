const mongoose = require('mongoose');

// Importa todos los schemas
const trainerSchema = require('./schemas/trainerSchema');
const leadSchema = require('./schemas/leadSchema');

// Exporta los modelos
module.exports = {
    Trainer: mongoose.models.Trainer || mongoose.model('Trainer', trainerSchema),
    Lead: mongoose.models.Lead || mongoose.model('Lead', leadSchema)
};
