// controllers/cuestionarioController.js
const Cuestionario = require('../models/Cuestionario');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer');

// Validar preguntas
const validarPreguntas = (preguntas) => {
  if (!Array.isArray(preguntas)) {
    throw new Error('Las preguntas deben ser un array');
  }

  preguntas.forEach((pregunta, index) => {
    if (!pregunta.texto || !pregunta.categoria || !pregunta.tipo) {
      throw new Error(`La pregunta ${index + 1} debe tener texto, categoria y tipo`);
    }

    if (!['texto', 'numero', 'opciones', 'boolean'].includes(pregunta.tipo)) {
      throw new Error(`El tipo '${pregunta.tipo}' en la pregunta ${index + 1} no es válido`);
    }

    if (pregunta.tipo === 'opciones') {
      if (!pregunta.opciones || !Array.isArray(pregunta.opciones) || pregunta.opciones.length === 0) {
        throw new Error(`La pregunta ${index + 1} es de tipo opciones pero no tiene opciones válidas`);
      }

      pregunta.opciones.forEach((opcion, opIndex) => {
        if (!opcion.texto || !opcion.valor) {
          throw new Error(`La opción ${opIndex + 1} de la pregunta ${index + 1} debe tener texto y valor`);
        }
      });
    }
  });
};

// Crear un nuevo cuestionario
exports.crearCuestionario = async (req, res) => {
  console.log('crearCuestionario - Inicio de la creación de un nuevo cuestionario');
  console.log('crearCuestionario - Datos recibidos:', req.body);

  try {
    const { titulo, descripcion, frecuencia, preguntas } = req.body;
    const entrenador = req.user._id; // Obtener el ID del entrenador del token

    // Validar preguntas
    try {
      validarPreguntas(preguntas);
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }

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
    const { titulo, descripcion, frecuencia, preguntas, estado, completion } = req.body;
    const entrenador = req.user._id; // Obtener el ID del entrenador del token

    // Si hay preguntas, validarlas
    if (preguntas) {
      try {
        validarPreguntas(preguntas);
      } catch (error) {
        return res.status(400).json({ mensaje: error.message });
      }
    }

    // Verificar que el cuestionario pertenece al entrenador
    const cuestionarioExistente = await Cuestionario.findById(id);
    if (!cuestionarioExistente) {
      return res.status(404).json({ mensaje: 'Cuestionario no encontrado' });
    }
    
    if (cuestionarioExistente.entrenador.toString() !== entrenador.toString()) {
      return res.status(403).json({ mensaje: 'No tienes permiso para modificar este cuestionario' });
    }

    // Preparar los datos actualizados
    const datosActualizados = {
      titulo,
      descripcion,
      frecuencia,
      preguntas,
      estado,
      completion,
      lastUpdate: Date.now(),
    };

    // Actualizar el cuestionario
    const cuestionarioActualizado = await Cuestionario.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true, runValidators: true }
    ).populate('clientes').populate('entrenador');

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

// Agregar clientes al cuestionario
exports.agregarClientes = async (req, res) => {
  const { id } = req.params;
  const { clienteIds } = req.body;
  console.log(`agregarClientes - Inicio de agregar clientes al cuestionario con ID: ${id}`);
  console.log('agregarClientes - IDs de clientes a agregar:', clienteIds);

  try {
    // Verificar que el cuestionario existe
    const cuestionario = await Cuestionario.findById(id);
    if (!cuestionario) {
      console.log('agregarClientes - Cuestionario no encontrado');
      return res.status(404).json({ mensaje: 'Cuestionario no encontrado' });
    }

    // Verificar que todos los clientes existen
    const clientesExistentes = await Client.find({ _id: { $in: clienteIds } });
    if (clientesExistentes.length !== clienteIds.length) {
      console.log('agregarClientes - No se encontraron todos los clientes');
      return res.status(404).json({ mensaje: 'Uno o más clientes no fueron encontrados' });
    }

    // Agregar los nuevos clientes al array de clientes (evitando duplicados)
    const clientesActualizados = [...new Set([...cuestionario.clientes.map(id => id.toString()), ...clienteIds])];
    
    // Actualizar directamente usando findByIdAndUpdate para evitar validaciones del esquema
    const cuestionarioActualizado = await Cuestionario.findByIdAndUpdate(
      id,
      { $set: { clientes: clientesActualizados } },
      { new: true }
    ).populate('clientes').populate('entrenador');

    if (!cuestionarioActualizado) {
      return res.status(404).json({ mensaje: 'Error al actualizar el cuestionario' });
    }

    console.log('agregarClientes - Clientes agregados exitosamente:', cuestionarioActualizado);
    res.status(200).json(cuestionarioActualizado);
  } catch (error) {
    console.error(`agregarClientes - Error al agregar clientes al cuestionario con ID ${id}:`, error);
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
