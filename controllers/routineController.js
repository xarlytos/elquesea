const Routine = require('../models/routinemodel');
const { validationResult } = require('express-validator');

// Obtener todas las rutinas del usuario
exports.getRoutines = async function (req, res) {
    try {
        const routines = await Routine.find({ userId: req.user._id });
        res.status(200).json({
            status: 'success',
            data: routines
        });
    } catch (error) {
        console.error('Error al obtener rutinas:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las rutinas'
        });
    }
};

// Obtener una rutina específica
exports.getRoutine = async function (req, res) {
    try {
        const routine = await Routine.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!routine) {
            return res.status(404).json({
                status: 'error',
                message: 'Rutina no encontrada'
            });
        }

        res.status(200).json({
            status: 'success',
            data: routine
        });
    } catch (error) {
        console.error('Error al obtener la rutina:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la rutina'
        });
    }
};

// Crear una nueva rutina
exports.createRoutine = async function (req, res) {
    console.log('=== INICIANDO CREACIÓN DE RUTINA ===');
    console.log('1. Body recibido:', JSON.stringify(req.body, null, 2));
    console.log('2. Usuario:', req.user._id);

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('3. Errores de validación encontrados:', errors.array());
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        console.log('4. Validación exitosa, preparando datos de la rutina');
        const routineData = {
            ...req.body,
            userId: req.user._id
        };
        console.log('5. Datos de rutina preparados:', JSON.stringify(routineData, null, 2));

        console.log('6. Intentando crear la rutina en la base de datos');
        const routine = await Routine.create(routineData);
        console.log('7. Rutina creada exitosamente:', routine._id);

        res.status(201).json({
            status: 'success',
            data: routine
        });
        console.log('8. Respuesta enviada al cliente');
    } catch (error) {
        console.error('ERROR en createRoutine:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la rutina',
            error: error.message
        });
    }
};

// Actualizar una rutina
exports.updateRoutine = async function (req, res) {
    try {
        const routine = await Routine.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user._id
            },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!routine) {
            return res.status(404).json({
                status: 'error',
                message: 'Rutina no encontrada'
            });
        }

        res.status(200).json({
            status: 'success',
            data: routine
        });
    } catch (error) {
        console.error('Error al actualizar la rutina:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar la rutina'
        });
    }
};

// Eliminar una rutina
exports.deleteRoutine = async function (req, res) {
    try {
        const routine = await Routine.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!routine) {
            return res.status(404).json({
                status: 'error',
                message: 'Rutina no encontrada'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Rutina eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar la rutina:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al eliminar la rutina'
        });
    }
};

// Duplicar una rutina
exports.duplicateRoutine = async function (req, res) {
    try {
        const originalRoutine = await Routine.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!originalRoutine) {
            return res.status(404).json({
                status: 'error',
                message: 'Rutina original no encontrada'
            });
        }

        const routineData = originalRoutine.toObject();
        delete routineData._id;
        routineData.name = `${routineData.name} (Copia)`;
        routineData.userId = req.user._id;

        const newRoutine = await Routine.create(routineData);
        res.status(201).json({
            status: 'success',
            data: newRoutine
        });
    } catch (error) {
        console.error('Error al duplicar la rutina:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al duplicar la rutina'
        });
    }
};
