// controllers/exerciseController.js

const Exercise = require('../models/Exercise');
const { validationResult } = require('express-validator');

// Crear un ejercicio
exports.createExercise = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, tipo, grupoMuscular, descripcion, equipo, imgUrl } = req.body;
    const newExercise = new Exercise({ nombre, tipo, grupoMuscular, descripcion, equipo, imgUrl });

    const savedExercise = await newExercise.save();
    res.status(201).json(savedExercise);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear ejercicio', error });
  }
};

// Obtener todos los ejercicios
exports.getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ejercicios', error });
  }
};

// Obtener un ejercicio por ID
exports.getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Ejercicio no encontrado' });
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ejercicio', error });
  }
};

// Actualizar un ejercicio
exports.updateExercise = async (req, res) => {
  try {
    const { nombre, tipo, grupoMuscular, descripcion, equipo, imgUrl } = req.body;
    let exercise = await Exercise.findById(req.params.id);

    if (!exercise) return res.status(404).json({ message: 'Ejercicio no encontrado' });

    exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      { nombre, tipo, grupoMuscular, descripcion, equipo, imgUrl },
      { new: true }
    );

    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar ejercicio', error });
  }
};

// Eliminar un ejercicio
exports.deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Ejercicio no encontrado' });

    await exercise.remove();
    res.json({ message: 'Ejercicio eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar ejercicio', error });
  }
};
