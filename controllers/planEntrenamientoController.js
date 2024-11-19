// controllers/planEntrenamientoController.js

const PlanEntrenamiento = require('../models/PlanEntrenamiento');
const { validationResult } = require('express-validator');

// Crear un plan de entrenamiento
exports.createPlanEntrenamiento = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, descripcion, duracion, fechaInicio, meta, cliente, semanas } = req.body;
    const entrenadorId = req.user.id;

    const newPlan = new PlanEntrenamiento({
      nombre,
      descripcion,
      duracion,
      fechaInicio,
      meta,
      cliente,
      creador: entrenadorId,
      semanas
    });

    const savedPlan = await newPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear plan de entrenamiento', error });
  }
};

// Obtener todos los planes del entrenador o los asignados a un cliente
exports.getPlanesEntrenamiento = async (req, res) => {
  try {
    const userId = req.user.id;
    const planes = req.user.rol === 'trainer'
      ? await PlanEntrenamiento.find({ creador: userId })
      : await PlanEntrenamiento.find({ cliente: userId });

    res.json(planes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener planes', error });
  }
};

// Obtener un plan de entrenamiento por ID
exports.getPlanEntrenamientoById = async (req, res) => {
  try {
    const plan = await PlanEntrenamiento.findById(req.params.id);

    if (!plan || (req.user.rol === 'trainer' && plan.creador.toString() !== req.user.id) ||
        (req.user.rol === 'client' && plan.cliente.toString() !== req.user.id)) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener plan de entrenamiento', error });
  }
};

// Actualizar un plan de entrenamiento
exports.updatePlanEntrenamiento = async (req, res) => {
  try {
    const { nombre, descripcion, duracion, fechaInicio, meta, semanas } = req.body;
    let plan = await PlanEntrenamiento.findById(req.params.id);

    if (!plan || plan.creador.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    plan = await PlanEntrenamiento.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion, duracion, fechaInicio, meta, semanas },
      { new: true }
    );

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar plan de entrenamiento', error });
  }
};

// Eliminar un plan de entrenamiento
exports.deletePlanEntrenamiento = async (req, res) => {
  try {
    const plan = await PlanEntrenamiento.findById(req.params.id);

    if (!plan || plan.creador.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    await plan.remove();
    res.json({ message: 'Plan de entrenamiento eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar plan de entrenamiento', error });
  }
};
// Crear una rutina simple sin semanas ni días
exports.createSimplePlanEntrenamiento = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, descripcion, duracion, fechaInicio, meta, cliente } = req.body;
    const entrenadorId = req.user.id;

    // Crear un nuevo plan de entrenamiento con solo los datos básicos
    const newPlan = new PlanEntrenamiento({
      nombre,
      descripcion,
      duracion,
      fechaInicio,
      meta,
      cliente,
      creador: entrenadorId,
      semanas: []  // Vacío para una rutina simple
    });

    const savedPlan = await newPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear rutina simple', error });
  }
};
