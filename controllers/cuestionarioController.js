// controllers/cuestionarioController.js
const Cuestionario = require('../models/Cuestionario');
const Client = require('../models/Client'); // Asegúrate de que existe este modelo
const Trainer = require('../models/Trainer'); // Asegúrate de que existe este modelo

// Crear un nuevo cuestionario
exports.crearCuestionario = async (req, res) => {
  console.log('crearCuestionario - Inicio de la creación de un nuevo cuestionario');
  console.log('crearCuestionario - Datos recibidos:', req.body);

  try {
    const { titulo, descripcion, frecuencia, preguntas, entrenador } = req.body;

    console.log('crearCuestionario - Título:', titulo);
    console.log('crearCuestionario - Descripción:', descripcion);
    console.log('crearCuestionario - Frecuencia:', frecuencia);
    console.log('crearCuestionario - Preguntas:', preguntas);
    console.log('crearCuestionario - Entrenador ID:', entrenador);

    // Verificar que el entrenador existe
    console.log('crearCuestionario - Verificando existencia del entrenador...');
    const entrenadorExiste = await Trainer.findById(entrenador);
    if (!entrenadorExiste) {
      console.log('crearCuestionario - Entrenador no encontrado');
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }
    console.log('crearCuestionario - Entrenador verificado:', entrenadorExiste);

    // Crear el nuevo cuestionario
    const nuevoCuestionario = new Cuestionario({
      titulo,
      descripcion,
      frecuencia,
      preguntas,
      entrenador,
    });

    console.log('crearCuestionario - Nuevo cuestionario creado:', nuevoCuestionario);

    // Guardar en la base de datos
    const cuestionarioGuardado = await nuevoCuestionario.save();
    console.log('crearCuestionario - Cuestionario guardado exitosamente:', cuestionarioGuardado);

    res.status(201).json(cuestionarioGuardado);
  } catch (error) {
    console.error('crearCuestionario - Error al crear cuestionario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener todos los cuestionarios
exports.obtenerCuestionarios = async (req, res) => {
  console.log('obtenerCuestionarios - Inicio de la obtención de todos los cuestionarios');

  try {
    const cuestionarios = await Cuestionario.find()
      .populate('clientes')
      .populate('entrenador');
    console.log('obtenerCuestionarios - Cuestionarios obtenidos:', cuestionarios.length);
    res.status(200).json(cuestionarios);
  } catch (error) {
    console.error('obtenerCuestionarios - Error al obtener cuestionarios:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener un cuestionario por ID
exports.obtenerCuestionarioPorId = async (req, res) => {
  const { id } = req.params;
  console.log(`obtenerCuestionarioPorId - Inicio de la obtención del cuestionario con ID: ${id}`);

  try {
    const cuestionario = await Cuestionario.findById(id)
      .populate('clientes')
      .populate('entrenador');

    if (!cuestionario) {
      console.log('obtenerCuestionarioPorId - Cuestionario no encontrado');
      return res.status(404).json({ mensaje: 'Cuestionario no encontrado' });
    }

    console.log('obtenerCuestionarioPorId - Cuestionario encontrado:', cuestionario);
    res.status(200).json(cuestionario);
  } catch (error) {
    console.error(`obtenerCuestionarioPorId - Error al obtener el cuestionario con ID ${id}:`, error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Actualizar un cuestionario
exports.actualizarCuestionario = async (req, res) => {
  const { id } = req.params;
  console.log(`actualizarCuestionario - Inicio de la actualización del cuestionario con ID: ${id}`);
  console.log('actualizarCuestionario - Datos recibidos:', req.body);

  try {
    const { titulo, descripcion, frecuencia, preguntas, entrenador, estado, completion } = req.body;

    // Verificar que el entrenador existe, si se actualiza
    if (entrenador) {
      console.log('actualizarCuestionario - Verificando existencia del entrenador...');
      const entrenadorExiste = await Trainer.findById(entrenador);
      if (!entrenadorExiste) {
        console.log('actualizarCuestionario - Entrenador no encontrado');
        return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
      }
      console.log('actualizarCuestionario - Entrenador verificado:', entrenadorExiste);
    }

    // Preparar los datos actualizados
    const datosActualizados = {
      titulo,
      descripcion,
      frecuencia,
      preguntas,
      entrenador,
      estado,
      completion,
      lastUpdate: Date.now(),
    };
    console.log('actualizarCuestionario - Datos a actualizar:', datosActualizados);

    // Actualizar el cuestionario
    const cuestionarioActualizado = await Cuestionario.findByIdAndUpdate(id, datosActualizados, { new: true, runValidators: true })
      .populate('clientes')
      .populate('entrenador');

    if (!cuestionarioActualizado) {
      console.log('actualizarCuestionario - Cuestionario no encontrado para actualizar');
      return res.status(404).json({ mensaje: 'Cuestionario no encontrado' });
    }

    console.log('actualizarCuestionario - Cuestionario actualizado exitosamente:', cuestionarioActualizado);
    res.status(200).json(cuestionarioActualizado);
  } catch (error) {
    console.error(`actualizarCuestionario - Error al actualizar el cuestionario con ID ${id}:`, error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Eliminar un cuestionario
exports.eliminarCuestionario = async (req, res) => {
  const { id } = req.params;
  console.log(`eliminarCuestionario - Inicio de la eliminación del cuestionario con ID: ${id}`);

  try {
    const cuestionarioEliminado = await Cuestionario.findByIdAndDelete(id);

    if (!cuestionarioEliminado) {
      console.log('eliminarCuestionario - Cuestionario no encontrado para eliminar');
      return res.status(404).json({ mensaje: 'Cuestionario no encontrado' });
    }

    console.log('eliminarCuestionario - Cuestionario eliminado exitosamente:', cuestionarioEliminado);
    res.status(200).json({ mensaje: 'Cuestionario eliminado exitosamente' });
  } catch (error) {
    console.error(`eliminarCuestionario - Error al eliminar el cuestionario con ID ${id}:`, error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};
