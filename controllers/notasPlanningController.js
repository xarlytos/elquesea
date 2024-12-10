const NotasPlanning = require('../models/Planning').NotasPlanning;
const Planning = require('../models/Planning').Planning;
const mongoose = require('mongoose');

// Crear una nueva nota
exports.crearNota = async (req, res) => {
    try {
        const { planningId, titulo, contenido, importante } = req.body;

        // Verificar que el planning existe
        const planning = await Planning.findById(planningId);
        if (!planning) {
            return res.status(404).json({ message: 'Planning no encontrado' });
        }

        // Crear la nueva nota
        const nuevaNota = new NotasPlanning({
            titulo,
            contenido,
            importante: importante || false,
            planning: planningId
        });

        // Guardar la nota
        const notaGuardada = await nuevaNota.save();

        // Actualizar el planning con la referencia a la nueva nota
        await Planning.findByIdAndUpdate(
            planningId,
            { $push: { notas: notaGuardada._id } }
        );

        res.status(201).json(notaGuardada);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener todas las notas de un planning
exports.obtenerNotasPorPlanning = async (req, res) => {
    try {
        const { planningId } = req.params;
        const notas = await NotasPlanning.find({ planning: planningId })
            .sort({ fecha: -1 }); // Ordenadas por fecha, las más recientes primero

        res.json(notas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener una nota específica
exports.obtenerNota = async (req, res) => {
    try {
        const nota = await NotasPlanning.findById(req.params.id);
        if (!nota) {
            return res.status(404).json({ message: 'Nota no encontrada' });
        }
        res.json(nota);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar una nota
exports.actualizarNota = async (req, res) => {
    try {
        const { titulo, contenido, importante } = req.body;
        const notaActualizada = await NotasPlanning.findByIdAndUpdate(
            req.params.id,
            { titulo, contenido, importante },
            { new: true }
        );

        if (!notaActualizada) {
            return res.status(404).json({ message: 'Nota no encontrada' });
        }

        res.json(notaActualizada);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Eliminar una nota
exports.eliminarNota = async (req, res) => {
    try {
        const nota = await NotasPlanning.findById(req.params.id);
        if (!nota) {
            return res.status(404).json({ message: 'Nota no encontrada' });
        }

        // Eliminar la referencia de la nota en el planning
        await Planning.findByIdAndUpdate(
            nota.planning,
            { $pull: { notas: nota._id } }
        );

        // Eliminar la nota
        await NotasPlanning.findByIdAndDelete(req.params.id);

        res.json({ message: 'Nota eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
