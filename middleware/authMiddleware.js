const jwt = require('jsonwebtoken');
const Trainer = require('../models/trainerModel');

exports.protectTrainer = async (req, res, next) => {
    try {
        // 1. Obtener el token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No estás autorizado para acceder a esta ruta. Por favor, inicia sesión.'
            });
        }

        // 2. Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Verificar si el trainer aún existe
        const trainer = await Trainer.findById(decoded.id);
        if (!trainer) {
            return res.status(401).json({
                status: 'error',
                message: 'El usuario perteneciente a este token ya no existe'
            });
        }

        // 4. Guardar el trainer en req para uso posterior
        req.trainer = trainer;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Token inválido o expirado'
        });
    }
};
