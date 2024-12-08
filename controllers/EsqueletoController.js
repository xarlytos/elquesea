const mongoose = require('mongoose');
const Esqueleto = require('../models/Esqueleto');
const Exercise = require('../models/Exercise');
const Trainer = require('../models/Trainer');

// Obtener todos los esqueletos con datos populados
const getAllEsqueletos = async (req, res) => {
  console.log('📋 [getAllEsqueletos] Iniciando búsqueda de todos los esqueletos');
  try {
    const esqueletos = await Esqueleto.find()
      .populate({
        path: 'plan',
        populate: {
          path: 'days',
          populate: {
            path: 'variants',
            populate: {
              path: 'sessions',
              populate: {
                path: 'exercises',
                populate: {
                  path: 'exercise',
                  select: 'nombre grupoMuscular descripcion equipo imgUrl'
                }
              }
            }
          }
        }
      })
      .exec();
    console.log(`✅ [getAllEsqueletos] ${esqueletos.length} esqueletos encontrados`);
    res.status(200).json(esqueletos);
  } catch (error) {
    console.error("❌ [getAllEsqueletos] Error:", error);
    res.status(500).json({ message: 'Error al obtener los esqueletos', error });
  }
};

// Obtener un esqueleto por ID
const getEsqueletoById = async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [getEsqueletoById] Buscando esqueleto con ID: ${id}`);
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`⚠️ [getEsqueletoById] ID inválido: ${id}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    const esqueleto = await Esqueleto.findById(id)
      .populate({
        path: 'plan',
        populate: {
          path: 'days',
          populate: {
            path: 'variants',
            populate: {
              path: 'sessions',
              populate: {
                path: 'exercises',
                populate: {
                  path: 'exercise',
                  select: 'nombre grupoMuscular descripcion equipo imgUrl'
                }
              }
            }
          }
        }
      });

    if (!esqueleto) {
      console.log(`⚠️ [getEsqueletoById] Esqueleto no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    console.log(`✅ [getEsqueletoById] Esqueleto encontrado: ${esqueleto.nombre}`);
    res.status(200).json(esqueleto);
  } catch (error) {
    console.error("❌ [getEsqueletoById] Error:", error);
    res.status(500).json({ message: 'Error al obtener el esqueleto', error });
  }
};

// Crear un nuevo esqueleto
const createEsqueleto = async (req, res) => {
  console.log('📋 [createEsqueleto] Iniciando creación de esqueleto');
  console.log('📦 [createEsqueleto] Datos recibidos:', req.body);
  try {
    const { nombre, descripcion, semanas } = req.body;

    if (!nombre || !descripcion || !semanas || semanas < 1) {
      console.log('⚠️ [createEsqueleto] Datos inválidos:', { nombre, descripcion, semanas });
      return res.status(400).json({ message: 'Faltan campos requeridos o el número de semanas es inválido' });
    }

    const weekPlans = [];

    // Crear las semanas
    for (let weekNum = 1; weekNum <= semanas; weekNum++) {
      const days = [];
      
      // Crear los días para cada semana (1-7)
      for (let dayNum = 1; dayNum <= 7; dayNum++) {
        const newDay = {
          dayNumber: dayNum,
          variants: []
        };
        days.push(newDay);
      }

      weekPlans.push({
        weekNumber: weekNum,
        days: days
      });
    }

    const newEsqueleto = new Esqueleto({
      nombre,
      descripcion,
      semanas,
      plan: weekPlans
    });

    await newEsqueleto.save();
    console.log(`✅ [createEsqueleto] Esqueleto creado exitosamente: ${newEsqueleto._id}`);
    res.status(201).json(newEsqueleto);
  } catch (error) {
    console.error("❌ [createEsqueleto] Error:", error);
    res.status(500).json({ message: 'Error al crear el esqueleto', error });
  }
};

// Actualizar un esqueleto
const updateEsqueleto = async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [updateEsqueleto] Iniciando actualización de esqueleto ID: ${id}`);
  console.log('📦 [updateEsqueleto] Datos de actualización:', req.body);
  try {
    const { nombre, descripcion, semanas } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`⚠️ [updateEsqueleto] ID inválido: ${id}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    const esqueleto = await Esqueleto.findById(id);
    if (!esqueleto) {
      console.log(`⚠️ [updateEsqueleto] Esqueleto no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    // Actualizar campos básicos
    if (nombre) esqueleto.nombre = nombre;
    if (descripcion) esqueleto.descripcion = descripcion;
    if (semanas && semanas !== esqueleto.semanas) {
      console.log(`📝 [updateEsqueleto] Actualizando número de semanas de ${esqueleto.semanas} a ${semanas}`);
      // Lógica para ajustar el número de semanas
      if (semanas > esqueleto.semanas) {
        // Añadir nuevas semanas
        for (let weekNum = esqueleto.semanas + 1; weekNum <= semanas; weekNum++) {
          const days = [];
          for (let dayNum = 1; dayNum <= 7; dayNum++) {
            days.push({
              dayNumber: dayNum,
              variants: []
            });
          }
          esqueleto.plan.push({
            weekNumber: weekNum,
            days: days
          });
        }
      } else {
        // Reducir semanas
        esqueleto.plan = esqueleto.plan.slice(0, semanas);
      }
      esqueleto.semanas = semanas;
    }

    await esqueleto.save();
    console.log(`✅ [updateEsqueleto] Esqueleto actualizado exitosamente: ${id}`);
    res.status(200).json(esqueleto);
  } catch (error) {
    console.error("❌ [updateEsqueleto] Error:", error);
    res.status(500).json({ message: 'Error al actualizar el esqueleto', error });
  }
};

// Eliminar un esqueleto
const deleteEsqueleto = async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [deleteEsqueleto] Iniciando eliminación de esqueleto ID: ${id}`);
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`⚠️ [deleteEsqueleto] ID inválido: ${id}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    const esqueleto = await Esqueleto.findById(id);
    if (!esqueleto) {
      console.log(`⚠️ [deleteEsqueleto] Esqueleto no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    await Esqueleto.findByIdAndDelete(id);
    console.log(`✅ [deleteEsqueleto] Esqueleto eliminado exitosamente: ${id}`);
    res.status(200).json({ message: 'Esqueleto eliminado correctamente' });
  } catch (error) {
    console.error("❌ [deleteEsqueleto] Error:", error);
    res.status(500).json({ message: 'Error al eliminar el esqueleto', error });
  }
};

// Añadir una variante a un día específico
const addVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, weekNumber, dayNumber } = req.body;

    console.log('🔍 [addVariant] Parámetros recibidos:', {
      esqueletoId: id,
      weekNumber,
      dayNumber,
      name,
      color
    });

    if (!name || !color || !weekNumber || !dayNumber) {
      console.log('⚠️ [addVariant] Faltan datos requeridos:', { name, color, weekNumber, dayNumber });
      return res.status(400).json({ 
        message: 'Datos incompletos',
        required: ['name', 'color', 'weekNumber', 'dayNumber'],
        received: { name, color, weekNumber, dayNumber }
      });
    }

    console.log(`📋 [addVariant] Añadiendo variante a esqueleto ID: ${id}, semana: ${weekNumber}, día: ${dayNumber}`);
    console.log('📦 [addVariant] Datos de variante:', req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`⚠️ [addVariant] ID inválido: ${id}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    const esqueleto = await Esqueleto.findById(id);
    if (!esqueleto) {
      console.log(`⚠️ [addVariant] Esqueleto no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    console.log('🔍 [addVariant] Buscando semana:', weekNumber);
    const week = esqueleto.plan.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      console.log(`⚠️ [addVariant] Semana no encontrada: ${weekNumber}`);
      return res.status(404).json({ message: 'Semana no encontrada' });
    }

    console.log('🔍 [addVariant] Buscando día:', dayNumber);
    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log(`⚠️ [addVariant] Día no encontrado: ${dayNumber}`);
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    console.log('📝 [addVariant] Creando nueva variante');
    const newVariant = {
      name,
      color,
      sessions: []
    };

    console.log('💾 [addVariant] Guardando variante en el día');
    day.variants.push(newVariant);
    
    console.log('💾 [addVariant] Guardando cambios en el esqueleto');
    await esqueleto.save();

    console.log(`✅ [addVariant] Variante añadida exitosamente al día ${dayNumber} de la semana ${weekNumber}`);
    res.status(201).json({
      message: 'Variante añadida exitosamente',
      variant: newVariant,
      location: {
        weekNumber,
        dayNumber,
        variantIndex: day.variants.length - 1
      }
    });
  } catch (error) {
    console.error("❌ [addVariant] Error:", error);
    res.status(500).json({ message: 'Error al añadir la variante', error: error.message });
  }
};

// Añadir una sesión a una variante
const addSession = async (req, res) => {
  try {
    const { esqueletoId, variantIndex } = req.params;
    const { name, tipo = 'Normal', rondas = 1, weekNumber, dayNumber } = req.body;

    console.log(`📋 [addSession] Añadiendo sesión a esqueleto ID: ${esqueletoId}, semana: ${weekNumber}, día: ${dayNumber}, variante: ${variantIndex}`);
    console.log('📦 [addSession] Datos de sesión:', req.body);

    if (!mongoose.Types.ObjectId.isValid(esqueletoId)) {
      console.log(`⚠️ [addSession] ID inválido: ${esqueletoId}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    if (!name || !tipo || !weekNumber || !dayNumber) {
      console.log('⚠️ [addSession] Faltan datos requeridos:', { name, tipo, weekNumber, dayNumber });
      return res.status(400).json({ 
        message: 'Datos incompletos',
        required: ['name', 'tipo', 'weekNumber', 'dayNumber'],
        received: { name, tipo, weekNumber, dayNumber }
      });
    }

    const esqueleto = await Esqueleto.findById(esqueletoId);
    if (!esqueleto) {
      console.log(`⚠️ [addSession] Esqueleto no encontrado con ID: ${esqueletoId}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    console.log('🔍 [addSession] Buscando semana:', weekNumber);
    const week = esqueleto.plan.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      console.log(`⚠️ [addSession] Semana no encontrada: ${weekNumber}`);
      return res.status(404).json({ message: 'Semana no encontrada' });
    }

    console.log('🔍 [addSession] Buscando día:', dayNumber);
    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log(`⚠️ [addSession] Día no encontrado: ${dayNumber}`);
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    if (variantIndex >= day.variants.length) {
      console.log(`⚠️ [addSession] Variante no encontrada: ${variantIndex}`);
      return res.status(404).json({ message: 'Variante no encontrada' });
    }

    console.log('📝 [addSession] Creando nueva sesión');
    const newSession = {
      name,
      tipo,
      rondas,
      exercises: [],
      order: day.variants[variantIndex].sessions.length + 1
    };

    console.log('💾 [addSession] Guardando sesión en la variante');
    day.variants[variantIndex].sessions.push(newSession);
    
    console.log('💾 [addSession] Guardando cambios en el esqueleto');
    await esqueleto.save();

    console.log(`✅ [addSession] Sesión añadida exitosamente`);
    res.status(201).json({
      message: 'Sesión añadida exitosamente',
      session: newSession,
      location: {
        weekNumber,
        dayNumber,
        variantIndex,
        sessionIndex: day.variants[variantIndex].sessions.length - 1
      }
    });
  } catch (error) {
    console.error("❌ [addSession] Error:", error);
    res.status(500).json({ message: 'Error al añadir la sesión', error: error.message });
  }
};

// Añadir un ejercicio a una sesión
const addExerciseToSession = async (req, res) => {
  try {
    const { esqueletoId, variantIndex, sessionIndex } = req.params;
    const { exerciseId, weekNumber, dayNumber, sets } = req.body;

    console.log(`📋 [addExerciseToSession] Iniciando proceso de agregar ejercicio`);
    console.log('🔍 [addExerciseToSession] Parámetros recibidos:', {
      esqueletoId, variantIndex, sessionIndex, exerciseId, weekNumber, dayNumber,
      sets: sets.length + ' sets'
    });

    // Validar ID del esqueleto
    if (!mongoose.Types.ObjectId.isValid(esqueletoId)) {
      console.log(`⚠️ [addExerciseToSession] ID de esqueleto inválido: ${esqueletoId}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    // Validar ID del ejercicio
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      console.log(`⚠️ [addExerciseToSession] ID de ejercicio inválido: ${exerciseId}`);
      return res.status(400).json({ message: 'ID de ejercicio inválido' });
    }

    // Buscar el esqueleto
    const esqueleto = await Esqueleto.findById(esqueletoId);
    if (!esqueleto) {
      console.log(`⚠️ [addExerciseToSession] Esqueleto no encontrado: ${esqueletoId}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    // Validar y procesar los sets
    for (let set of sets) {
      // Validar el tipo de peso
      if (set.weightType === 'rmPercentage') {
        if (!set.rmPercentage || set.rmPercentage < 0 || set.rmPercentage > 100) {
          return res.status(400).json({ 
            message: 'El porcentaje de RM debe estar entre 0 y 100',
            set
          });
        }
        
        // Si es porcentaje de RM, el peso se calculará en tiempo de ejecución
        // basado en el RM actual del usuario para ese ejercicio
        set.weight = null;
      } else {
        // Si es peso absoluto, asegurarse de que sea un número válido
        if (typeof set.weight !== 'number' || set.weight < 0) {
          return res.status(400).json({ 
            message: 'El peso debe ser un número positivo',
            set
          });
        }
      }
    }

    // Encontrar la sesión correcta
    const variant = esqueleto.plan[0].days[0].variants[variantIndex];
    if (!variant) {
      console.log(`⚠️ [addExerciseToSession] Variante no encontrada: ${variantIndex}`);
      return res.status(404).json({ message: 'Variante no encontrada' });
    }

    const session = variant.sessions[sessionIndex];
    if (!session) {
      console.log(`⚠️ [addExerciseToSession] Sesión no encontrada: ${sessionIndex}`);
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    // Crear el nuevo ejercicio con sets
    const newExercise = {
      exercise: exerciseId,
      sets: sets,
      order: session.exercises.length
    };

    // Agregar el ejercicio a la sesión
    session.exercises.push(newExercise);

    // Guardar los cambios
    console.log('💾 [addExerciseToSession] Guardando cambios');
    await esqueleto.save();

    console.log('✅ [addExerciseToSession] Ejercicio agregado exitosamente');
    res.status(200).json({
      message: 'Ejercicio agregado exitosamente',
      exercise: newExercise,
      location: {
        variantIndex,
        sessionIndex,
        exerciseIndex: session.exercises.length - 1
      }
    });

  } catch (error) {
    console.error('❌ [addExerciseToSession] Error:', error);
    res.status(500).json({ 
      message: 'Error al agregar ejercicio a la sesión',
      error: error.message,
      stack: error.stack
    });
  }
};

// Eliminar una sesión
const deleteSession = async (req, res) => {
  try {
    const { esqueletoId, weekNumber, dayNumber, variantIndex, sessionIndex } = req.params;

    console.log(`📋 [deleteSession] Eliminando sesión de esqueleto ID: ${esqueletoId}, semana: ${weekNumber}, día: ${dayNumber}, variante: ${variantIndex}, sesión: ${sessionIndex}`);

    if (!mongoose.Types.ObjectId.isValid(esqueletoId)) {
      console.log(`⚠️ [deleteSession] ID inválido: ${esqueletoId}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    const esqueleto = await Esqueleto.findById(esqueletoId);
    if (!esqueleto) {
      console.log(`⚠️ [deleteSession] Esqueleto no encontrado con ID: ${esqueletoId}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    const week = esqueleto.plan.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      console.log(`⚠️ [deleteSession] Semana no encontrada: ${weekNumber}`);
      return res.status(404).json({ message: 'Semana no encontrada' });
    }

    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log(`⚠️ [deleteSession] Día no encontrado: ${dayNumber}`);
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    if (variantIndex >= day.variants.length) {
      console.log(`⚠️ [deleteSession] Variante no encontrada: ${variantIndex}`);
      return res.status(404).json({ message: 'Variante no encontrada' });
    }

    const variant = day.variants[variantIndex];
    if (sessionIndex >= variant.sessions.length) {
      console.log(`⚠️ [deleteSession] Sesión no encontrada: ${sessionIndex}`);
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    // Eliminar la sesión
    variant.sessions.splice(sessionIndex, 1);

    // Reordenar las sesiones restantes
    variant.sessions.forEach((session, index) => {
      session.order = index + 1;
    });

    await esqueleto.save();
    console.log(`✅ [deleteSession] Sesión eliminada exitosamente`);
    res.status(200).json({ message: 'Sesión eliminada correctamente' });
  } catch (error) {
    console.error("❌ [deleteSession] Error:", error);
    res.status(500).json({ message: 'Error al eliminar la sesión', error });
  }
};

// Actualizar la configuración de renderizado de un set
const updateSetRenderConfig = async (req, res) => {
  try {
    const { esqueletoId, variantIndex, sessionIndex, exerciseIndex, setIndex } = req.params;
    const { campo1, campo2, campo3 } = req.body;

    console.log(`📋 [updateSetRenderConfig] Iniciando actualización de configuración de renderizado`);
    console.log('🔍 [updateSetRenderConfig] Parámetros recibidos:', {
      esqueletoId,
      variantIndex,
      sessionIndex,
      exerciseIndex,
      setIndex,
      renderConfig: { campo1, campo2, campo3 }
    });

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(esqueletoId)) {
      console.log(`⚠️ [updateSetRenderConfig] ID inválido: ${esqueletoId}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    // Validar campos requeridos
    if (!campo1 && !campo2 && !campo3) {
      console.log('⚠️ [updateSetRenderConfig] No se proporcionaron campos para actualizar');
      return res.status(400).json({ 
        message: 'Debe proporcionar al menos un campo para actualizar',
        allowedFields: ['campo1', 'campo2', 'campo3'],
        allowedValues: ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round']
      });
    }

    // Buscar el esqueleto
    console.log(`🔍 [updateSetRenderConfig] Buscando esqueleto con ID: ${esqueletoId}`);
    const esqueleto = await Esqueleto.findById(esqueletoId);
    if (!esqueleto) {
      console.log(`⚠️ [updateSetRenderConfig] Esqueleto no encontrado con ID: ${esqueletoId}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    // Validar índices
    const variant = esqueleto.plan[0].days[0].variants[variantIndex];
    if (!variant) {
      console.log(`⚠️ [updateSetRenderConfig] Variante no encontrada: ${variantIndex}`);
      return res.status(404).json({ message: 'Variante no encontrada' });
    }

    const session = variant.sessions[sessionIndex];
    if (!session) {
      console.log(`⚠️ [updateSetRenderConfig] Sesión no encontrada: ${sessionIndex}`);
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    const exercise = session.exercises[exerciseIndex];
    if (!exercise) {
      console.log(`⚠️ [updateSetRenderConfig] Ejercicio no encontrado: ${exerciseIndex}`);
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    const set = exercise.sets[setIndex];
    if (!set) {
      console.log(`⚠️ [updateSetRenderConfig] Set no encontrado: ${setIndex}`);
      return res.status(404).json({ message: 'Set no encontrado' });
    }

    // Actualizar solo los campos proporcionados
    console.log('📝 [updateSetRenderConfig] Actualizando configuración');
    if (campo1) set.renderConfig.campo1 = campo1;
    if (campo2) set.renderConfig.campo2 = campo2;
    if (campo3) set.renderConfig.campo3 = campo3;

    // Guardar cambios
    console.log('💾 [updateSetRenderConfig] Guardando cambios');
    await esqueleto.save();

    console.log('✅ [updateSetRenderConfig] Configuración actualizada exitosamente');
    res.status(200).json({
      message: 'Configuración de renderizado actualizada exitosamente',
      renderConfig: set.renderConfig,
      location: {
        variantIndex,
        sessionIndex,
        exerciseIndex,
        setIndex
      }
    });
  } catch (error) {
    console.error("❌ [updateSetRenderConfig] Error:", error);
    res.status(500).json({ 
      message: 'Error al actualizar la configuración de renderizado', 
      error: error.message,
      stack: error.stack 
    });
  }
};

module.exports = {
  getAllEsqueletos,
  getEsqueletoById,
  createEsqueleto,
  updateEsqueleto,
  deleteEsqueleto,
  addVariant,
  addSession,
  addExerciseToSession,
  deleteSession,
  updateSetRenderConfig
};