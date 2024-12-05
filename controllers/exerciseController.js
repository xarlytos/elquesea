const Exercise = require('../models/Exercise');

// Obtener todos los ejercicios
const getAllExercises = async (req, res) => {
  try {
    console.log('\n=== 📋 OBTENIENDO TODOS LOS EJERCICIOS ===');
    const exercises = await Exercise.find();
    return res.status(200).json({
      message: 'Ejercicios obtenidos exitosamente',
      data: exercises
    });
  } catch (error) {
    console.error('❌ Error al obtener ejercicios:', error);
    return res.status(500).json({
      message: 'Error al obtener los ejercicios',
      error: error.message
    });
  }
};

// Obtener un ejercicio por ID
const getExerciseById = async (req, res) => {
  try {
    console.log('\n=== 🔍 BUSCANDO EJERCICIO ===');
    const { id } = req.params;
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      console.log('❌ Ejercicio no encontrado');
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    return res.status(200).json({
      message: 'Ejercicio encontrado exitosamente',
      data: exercise
    });
  } catch (error) {
    console.error('❌ Error al buscar ejercicio:', error);
    return res.status(500).json({
      message: 'Error al buscar el ejercicio',
      error: error.message
    });
  }
};

// Crear un nuevo ejercicio
const createExercise = async (req, res) => {
  try {
    console.log('\n=== 🏋️ CREANDO NUEVO EJERCICIO ===');
    const exerciseData = req.body;
    console.log('📝 Datos recibidos:', exerciseData);
    
    // Validación de campos requeridos
    console.log('🔍 Validando campos requeridos...');
    if (!exerciseData.nombre) {
      console.log('❌ Error: El nombre es requerido');
      return res.status(400).json({
        message: 'El nombre del ejercicio es requerido'
      });
    }

    // Asegurar que equipo sea un array
    if (exerciseData.equipo && !Array.isArray(exerciseData.equipo)) {
      exerciseData.equipo = [exerciseData.equipo];
    }

    console.log('✅ Validación exitosa');
    console.log('📦 Creando instancia del modelo Exercise...');
    const newExercise = new Exercise(exerciseData);
    
    console.log('💾 Guardando ejercicio en la base de datos...');
    await newExercise.save();

    console.log('✅ Ejercicio creado exitosamente');
    console.log('📊 Datos del ejercicio creado:', newExercise);
    
    return res.status(201).json({
      message: 'Ejercicio creado exitosamente',
      data: newExercise
    });
  } catch (error) {
    console.error('❌ Error al crear ejercicio:', error);
    console.error('📄 Detalles del error:', {
      mensaje: error.message,
      codigo: error.code,
      nombre: error.name
    });
    return res.status(500).json({
      message: 'Error al crear el ejercicio',
      error: error.message
    });
  }
};

// Actualizar un ejercicio
const updateExercise = async (req, res) => {
  try {
    console.log('\n=== ✏️ ACTUALIZANDO EJERCICIO ===');
    const { id } = req.params;
    const updateData = req.body;
    console.log('📝 Datos de actualización:', { id, updateData });

    // Asegurar que equipo sea un array si está presente
    if (updateData.equipo && !Array.isArray(updateData.equipo)) {
      updateData.equipo = [updateData.equipo];
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedExercise) {
      console.log('❌ Ejercicio no encontrado');
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    console.log('✅ Ejercicio actualizado exitosamente');
    return res.status(200).json({
      message: 'Ejercicio actualizado exitosamente',
      data: updatedExercise
    });
  } catch (error) {
    console.error('❌ Error al actualizar ejercicio:', error);
    return res.status(500).json({
      message: 'Error al actualizar el ejercicio',
      error: error.message
    });
  }
};

// Eliminar un ejercicio
const deleteExercise = async (req, res) => {
  try {
    console.log('\n=== 🗑️ ELIMINANDO EJERCICIO ===');
    const { id } = req.params;
    console.log('🔍 ID del ejercicio a eliminar:', id);

    const deletedExercise = await Exercise.findByIdAndDelete(id);

    if (!deletedExercise) {
      console.log('❌ Ejercicio no encontrado');
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    console.log('✅ Ejercicio eliminado exitosamente');
    return res.status(200).json({
      message: 'Ejercicio eliminado exitosamente',
      data: deletedExercise
    });
  } catch (error) {
    console.error('❌ Error al eliminar ejercicio:', error);
    return res.status(500).json({
      message: 'Error al eliminar el ejercicio',
      error: error.message
    });
  }
};

// Buscar ejercicios por grupo muscular
const getExercisesByMuscleGroup = async (req, res) => {
  try {
    console.log('\n=== 💪 BUSCANDO EJERCICIOS POR GRUPO MUSCULAR ===');
    const { grupoMuscular } = req.params;
    console.log('🔍 Grupo muscular:', grupoMuscular);

    const exercises = await Exercise.find({ 
      grupoMuscular: { $in: [grupoMuscular] } 
    });

    return res.status(200).json({
      message: 'Ejercicios encontrados exitosamente',
      data: exercises
    });
  } catch (error) {
    console.error('❌ Error al buscar ejercicios:', error);
    return res.status(500).json({
      message: 'Error al buscar ejercicios por grupo muscular',
      error: error.message
    });
  }
};

module.exports = {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getExercisesByMuscleGroup
};
