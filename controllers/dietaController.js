// controllers/dietaController.js
const mongoose = require('mongoose');
const Dieta = require('../models/Dieta');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer');

// Utilidad para crear los 7 días de una semana
const crearDias = (fechaInicioSemana) => {
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dias = diasSemana.map((diaNombre, index) => {
    const fechaDia = new Date(fechaInicioSemana);
    fechaDia.setDate(fechaInicioSemana.getDate() + index);

    return {
      fecha: fechaDia,
      restricciones: {
        calorias: 2000, // Puedes ajustar estos valores según tus necesidades
        proteinas: 150,
        carbohidratos: 250,
        grasas: 70,
      },
      comidas: [
        {
          numero: 1,
          peso: 200,
          ingredientes: [
            {
              nombre: "Avena",
              calorias: 300,
              proteinas: 10,
              carbohidratos: 50,
              grasas: 5
            },
            {
              nombre: "Leche de almendra",
              calorias: 100,
              proteinas: 2,
              carbohidratos: 8,
              grasas: 3
            }
          ]
        },
        // Puedes agregar más comidas aquí si lo deseas
      ]
    };
  });

  return dias;
};

// Obtener todas las dietas con datos populados
// Obtener todas las dietas del entrenador autenticado con datos populados
const getAllDietas = async (req, res) => {
    try {
      const trainerId = req.user.id; // Obtener el ID del entrenador desde el token
      console.log(`getAllDietas - ID del entrenador autenticado: ${trainerId}`);
  
      // Validar que el ID del entrenador es válido
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        console.log(`getAllDietas - ID de entrenador inválido: ${trainerId}`);
        return res.status(400).json({ mensaje: 'ID de entrenador inválido' });
      }
  
      // Buscar dietas asociadas al entrenador autenticado
      const dietas = await Dieta.find({ trainer: trainerId })
        .populate('cliente', 'nombre email') // Popula el cliente con campos seleccionados
        .populate('trainer', 'nombre email especialidad') // Popula el entrenador con campos seleccionados
        .exec();
  
      console.log(`getAllDietas - Dietas obtenidas para el entrenador ${trainerId}:`, dietas);
  
      res.status(200).json(dietas);
    } catch (error) {
      console.error("getAllDietas - Error:", error);
      res.status(500).json({ mensaje: 'Error al obtener las dietas', error });
    }
  };
  
// Obtener una dieta por ID con datos populados
const getDietaById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`getDietaById - Solicitud para obtener dieta con ID: ${id}`);

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`getDietaById - ID de dieta inválido: ${id}`);
      return res.status(400).json({ mensaje: 'ID de dieta inválido' });
    }

    const dieta = await Dieta.findById(id)
      .populate('cliente', 'nombre email')
      .populate('trainer', 'nombre email especialidad')
      .exec();

    if (!dieta) {
      console.log(`getDietaById - Dieta no encontrada con ID: ${id}`);
      return res.status(404).json({ mensaje: 'Dieta no encontrada' });
    }

    // Verificar que el entrenador autenticado sea el creador de la dieta
    if (dieta.trainer.toString() !== req.user.id) {
      console.log(`getDietaById - Entrenador con ID: ${req.user.id} no tiene permiso para acceder a esta dieta.`);
      return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta dieta.' });
    }

    console.log(`getDietaById - Dieta encontrada:`, dieta);
    res.status(200).json(dieta);
  } catch (error) {
    console.error("getDietaById - Error:", error);
    res.status(500).json({ mensaje: 'Error al obtener la dieta', error });
  }
};

// Crear una nueva dieta y agregar automáticamente la primera semana
const crearDieta = async (req, res) => {
  try {
    const {
      nombre,
      clienteId,
      fechaInicio,
      objetivo,
      restricciones,
      fechaComienzo,
      // No necesitas recibir semanas en el body, ya que se agregará automáticamente la primera semana
    } = req.body;

    console.log("crearDieta - Datos recibidos para crear una nueva dieta:", req.body);

    // Validar campos requeridos
    if (!nombre || !clienteId || !fechaInicio || !objetivo || !restricciones || !fechaComienzo) {
      console.log("crearDieta - Faltan campos requeridos.");
      return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    // Obtener el ID del trainer desde el token
    const trainerId = req.user.id;
    console.log(`crearDieta - ID del entrenador autenticado: ${trainerId}`);

    // Verificar si el cliente existe
    const cliente = await Client.findById(clienteId);
    if (!cliente) {
      console.log(`crearDieta - Cliente no encontrado con ID: ${clienteId}`);
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    console.log(`crearDieta - Cliente encontrado:`, cliente);

    // Verificar si el cliente está asociado con el trainer
    // Asumiendo que el modelo Client tiene un campo 'trainer' que referencia al Trainer
    if (cliente.trainer.toString() !== trainerId) {
      console.log(`crearDieta - Cliente con ID: ${clienteId} no está asociado con el entrenador: ${trainerId}`);
      return res.status(403).json({ mensaje: 'No tienes permiso para asignar este cliente a una dieta.' });
    }

    console.log("crearDieta - Asociando cliente con la dieta.");

    // Crear la primera semana
    const semanaInicial = {
      idSemana: 1,
      fechaInicio: new Date(fechaInicio),
      dias: crearDias(new Date(fechaInicio)),
    };

    // Crear la nueva dieta
    const nuevaDieta = new Dieta({
      nombre,
      cliente: clienteId,
      trainer: trainerId,
      fechaInicio,
      objetivo,
      restricciones,
      fechaComienzo,
      semanas: [semanaInicial],
    });

    console.log("crearDieta - Guardando nueva dieta en la base de datos:", nuevaDieta);

    await nuevaDieta.save();

    console.log("crearDieta - Dieta creada exitosamente:", nuevaDieta);
    res.status(201).json(nuevaDieta);
  } catch (error) {
    console.error("crearDieta - Error:", error);
    res.status(500).json({ mensaje: 'Error al crear la dieta', error });
  }
};

// Actualizar una dieta por ID
const actualizarDieta = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`actualizarDieta - Solicitud para actualizar dieta con ID: ${id}`);
    const {
      nombre,
      clienteId,
      fechaInicio,
      objetivo,
      restricciones,
      fechaComienzo,
      semanas,
      estado,
    } = req.body;

    console.log("actualizarDieta - Datos recibidos para actualizar:", req.body);

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`actualizarDieta - ID de dieta inválido: ${id}`);
      return res.status(400).json({ mensaje: 'ID de dieta inválido' });
    }

    const dieta = await Dieta.findById(id);
    if (!dieta) {
      console.log(`actualizarDieta - Dieta no encontrada con ID: ${id}`);
      return res.status(404).json({ mensaje: 'Dieta no encontrada' });
    }

    // Verificar que el entrenador del planning coincida con el entrenador autenticado
    if (dieta.trainer.toString() !== req.user.id) {
      console.log(`actualizarDieta - Entrenador con ID: ${req.user.id} no tiene permiso para actualizar esta dieta.`);
      return res.status(403).json({ mensaje: 'No tienes permiso para actualizar esta dieta.' });
    }

    // Si se proporciona un nuevo cliente, verificar su existencia y asociación
    if (clienteId && clienteId !== dieta.cliente.toString()) {
      const cliente = await Client.findById(clienteId);
      if (!cliente) {
        console.log(`actualizarDieta - Cliente no encontrado con ID: ${clienteId}`);
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }

      if (cliente.trainer.toString() !== req.user.id) {
        console.log(`actualizarDieta - Cliente con ID: ${clienteId} no está asociado con el entrenador: ${req.user.id}`);
        return res.status(403).json({ mensaje: 'No tienes permiso para asignar este cliente a la dieta.' });
      }

      console.log("actualizarDieta - Asociando nuevo cliente con la dieta.");
      dieta.cliente = clienteId;
    }

    // Actualizar campos si están presentes
    if (nombre) dieta.nombre = nombre;
    if (fechaInicio) dieta.fechaInicio = fechaInicio;
    if (objetivo) dieta.objetivo = objetivo;
    if (restricciones) dieta.restricciones = restricciones;
    if (fechaComienzo) dieta.fechaComienzo = fechaComienzo;
    if (semanas) dieta.semanas = semanas;
    if (estado) dieta.estado = estado;

    console.log("actualizarDieta - Dieta actualizada antes de guardar:", dieta);

    await dieta.save();

    console.log("actualizarDieta - Dieta actualizada exitosamente:", dieta);
    res.status(200).json(dieta);
  } catch (error) {
    console.error("actualizarDieta - Error:", error);
    res.status(500).json({ mensaje: 'Error al actualizar la dieta', error });
  }
};

// Eliminar una dieta por ID
const eliminarDieta = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`eliminarDieta - Solicitud para eliminar dieta con ID: ${id}`);

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`eliminarDieta - ID de dieta inválido: ${id}`);
      return res.status(400).json({ mensaje: 'ID de dieta inválido' });
    }

    const dieta = await Dieta.findById(id);
    if (!dieta) {
      console.log(`eliminarDieta - Dieta no encontrada con ID: ${id}`);
      return res.status(404).json({ mensaje: 'Dieta no encontrada' });
    }

    // Verificar que el entrenador del planning coincida con el entrenador autenticado
    if (dieta.trainer.toString() !== req.user.id) {
      console.log(`eliminarDieta - Entrenador con ID: ${req.user.id} no tiene permiso para eliminar esta dieta.`);
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta dieta.' });
    }

    await Dieta.findByIdAndDelete(id);
    console.log(`eliminarDieta - Dieta con ID: ${id} eliminada exitosamente.`);
    res.status(200).json({ mensaje: 'Dieta eliminada correctamente' });
  } catch (error) {
    console.error("eliminarDieta - Error:", error);
    res.status(500).json({ mensaje: 'Error al eliminar la dieta', error });
  }
};

// Nueva función para obtener dietas del entrenador autenticado sin incluir semanas
const getDietasByTrainer = async (req, res) => {
    try {
      const trainerId = req.user.id; // Obtener el ID del entrenador autenticado
      console.log(`getDietasByTrainer - ID del entrenador autenticado: ${trainerId}`);
  
      // Validar que el ID del entrenador es válido
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        console.log(`getDietasByTrainer - ID de entrenador inválido: ${trainerId}`);
        return res.status(400).json({ mensaje: 'ID de entrenador inválido' });
      }
  
      // Seleccionar solo los campos deseados, excluyendo 'semanas' y otros subdocumentos si es necesario
      const dietas = await Dieta.find({ trainer: trainerId })
        .select('_id nombre cliente fechaInicio objetivo restricciones estado acciones') // Ajusta los campos según tus necesidades
        .populate('cliente', 'nombre email') // Añadir populate para obtener el nombre y email del cliente
        .exec();
  
      console.log(`getDietasByTrainer - Dietas obtenidas para el entrenador ${trainerId}:`, dietas);
  
      res.status(200).json(dietas);
    } catch (error) {
      console.error("getDietasByTrainer - Error:", error);
      res.status(500).json({ mensaje: 'Error al obtener las dietas del entrenador', error });
    }
  };
  
// Exportar la nueva función junto con las existentes
module.exports = {
  getAllDietas,
  getDietaById,
  crearDieta,
  actualizarDieta,
  eliminarDieta,
  getDietasByTrainer, // Nueva función exportada
};
