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
        path: 'periodos',
        populate: {
          path: 'variants',
          populate: {
            path: 'exercises',
            populate: {
              path: 'exercise',
              select: 'nombre grupoMuscular descripcion equipo imgUrl'
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
        path: 'periodos',
        populate: {
          path: 'variants',
          populate: {
            path: 'exercises',
            populate: {
              path: 'exercise',
              select: 'nombre grupoMuscular descripcion equipo imgUrl'
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
    const { nombre, descripcion, periodos = [] } = req.body;

    if (!nombre) {
      console.log('⚠️ [createEsqueleto] Datos inválidos:', { nombre });
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const newEsqueleto = new Esqueleto({
      nombre,
      descripcion,
      periodos
    });

    await newEsqueleto.save();
    console.log(`✅ [createEsqueleto] Esqueleto creado exitosamente: ${newEsqueleto._id}`);
    res.status(201).json(newEsqueleto);
  } catch (error) {
    console.error("❌ [createEsqueleto] Error:", error);
    res.status(500).json({ message: 'Error al crear el esqueleto', error });
  }
};

// Añadir una variante a un período
const addVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { color, periodoId } = req.body;

    console.log('🔍 [addVariant] Parámetros recibidos:', {
      esqueletoId: id,
      periodoId,
      color
    });

    if (!color || !periodoId) {
      console.log('⚠️ [addVariant] Faltan datos requeridos:', { color, periodoId });
      return res.status(400).json({ 
        message: 'Datos incompletos',
        required: ['color', 'periodoId'],
        received: { color, periodoId }
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`⚠️ [addVariant] ID inválido: ${id}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    const esqueleto = await Esqueleto.findById(id);
    if (!esqueleto) {
      console.log(`⚠️ [addVariant] Esqueleto no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    const periodo = esqueleto.periodos.id(periodoId);
    if (!periodo) {
      console.log(`⚠️ [addVariant] Período no encontrado: ${periodoId}`);
      return res.status(404).json({ message: 'Período no encontrado' });
    }

    console.log('📝 [addVariant] Creando nueva variante');
    const newVariant = {
      color,
      exercises: []
    };

    console.log('💾 [addVariant] Guardando variante en el período');
    periodo.variants.push(newVariant);
    
    console.log('💾 [addVariant] Guardando cambios en el esqueleto');
    await esqueleto.save();

    console.log(`✅ [addVariant] Variante añadida exitosamente al período ${periodoId}`);
    res.status(201).json({
      message: 'Variante añadida exitosamente',
      variant: newVariant,
      location: {
        periodoId,
        variantIndex: periodo.variants.length - 1
      }
    });
  } catch (error) {
    console.error("❌ [addVariant] Error:", error);
    res.status(500).json({ message: 'Error al añadir la variante', error: error.message });
  }
};

// Añadir un ejercicio a una variante
const addExerciseToVariant = async (req, res) => {
  try {
    const { esqueletoId, periodoId, variantIndex } = req.params;
    const { exerciseId, sets } = req.body;

    console.log(`📋 [addExerciseToVariant] Iniciando proceso de agregar ejercicio`);
    console.log('🔍 [addExerciseToVariant] Parámetros recibidos:', {
      esqueletoId, periodoId, variantIndex, exerciseId,
      sets: sets.length + ' sets'
    });

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(esqueletoId)) {
      console.log(`⚠️ [addExerciseToVariant] ID de esqueleto inválido: ${esqueletoId}`);
      return res.status(400).json({ message: 'ID de esqueleto inválido' });
    }

    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      console.log(`⚠️ [addExerciseToVariant] ID de ejercicio inválido: ${exerciseId}`);
      return res.status(400).json({ message: 'ID de ejercicio inválido' });
    }

    // Buscar el esqueleto
    const esqueleto = await Esqueleto.findById(esqueletoId);
    if (!esqueleto) {
      console.log(`⚠️ [addExerciseToVariant] Esqueleto no encontrado: ${esqueletoId}`);
      return res.status(404).json({ message: 'Esqueleto no encontrado' });
    }

    // Buscar el ejercicio
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      console.log(`⚠️ [addExerciseToVariant] Ejercicio no encontrado: ${exerciseId}`);
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    // Encontrar el período y la variante
    const periodo = esqueleto.periodos.id(periodoId);
    if (!periodo) {
      console.log(`⚠️ [addExerciseToVariant] Período no encontrado: ${periodoId}`);
      return res.status(404).json({ message: 'Período no encontrado' });
    }

    if (variantIndex >= periodo.variants.length) {
      console.log(`⚠️ [addExerciseToVariant] Variante no encontrada: ${variantIndex}`);
      return res.status(404).json({ message: 'Variante no encontrada' });
    }

    // Crear el nuevo ejercicio con sus sets
    const newExercise = {
      exercise: exerciseId,
      sets: sets
    };

    // Añadir el ejercicio a la variante
    periodo.variants[variantIndex].exercises.push(newExercise);

    // Guardar los cambios
    await esqueleto.save();

    console.log(`✅ [addExerciseToVariant] Ejercicio añadido exitosamente`);
    res.status(201).json({
      message: 'Ejercicio añadido exitosamente',
      exercise: newExercise,
      location: {
        periodoId,
        variantIndex,
        exerciseIndex: periodo.variants[variantIndex].exercises.length - 1
      }
    });
  } catch (error) {
    console.error("❌ [addExerciseToVariant] Error:", error);
    res.status(500).json({ message: 'Error al añadir el ejercicio', error: error.message });
  }
};

module.exports = {
  getAllEsqueletos,
  getEsqueletoById,
  createEsqueleto,
  addVariant,
  addExerciseToVariant
};