// src/controllers/planningController.js
const mongoose = require('mongoose');
const {
  Planning,
  WeekPlan,
  DayPlan,
  Session,
  Exercise,
  Set,
  CheckIn,
} = require('../models/Planning');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer');

// Obtener todos los plannings con todos los datos populados
const getAllPlannings = async (req, res) => {
    try {
      const plannings = await Planning.find()
        .populate('cliente', 'nombre email')
        .populate('trainer', 'nombre email especialidad')
        .populate({
          path: 'plan',
          populate: {
            path: 'days',
            populate: {
              path: 'sessions',
              populate: {
                path: 'exercises',
                populate: {
                  path: 'sets',
                  populate: {
                    path: 'checkIns',
                  },
                },
              },
            },
          },
        })
        .exec();
      res.status(200).json(plannings);
    } catch (error) {
      console.error("getAllPlannings - Error:", error);
      res.status(500).json({ message: 'Error al obtener los plannings', error });
    }
  };
  
  // Obtener un planning por ID con todos los datos populados
  const getPlanningById = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Validar ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID de planning inválido' });
      }
  
      const planning = await Planning.findById(id)
        .populate('cliente', 'nombre email')
        .populate('trainer', 'nombre email especialidad')
        .populate({
          path: 'plan',
          populate: {
            path: 'days',
            populate: {
              path: 'sessions',
              populate: {
                path: 'exercises',
                populate: {
                  path: 'sets',
                  populate: {
                    path: 'checkIns',
                  },
                },
              },
            },
          },
        })
        .exec();
  
      if (!planning) {
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
  
      res.status(200).json(planning);
    } catch (error) {
      console.error("getPlanningById - Error:", error);
      res.status(500).json({ message: 'Error al obtener el planning', error });
    }
  };
  
  // Crear un nuevo planning con una semana por defecto
  const createPlanning = async (req, res) => {
    try {
      const { nombre, descripcion, fechaInicio, meta, semanas = 1, clienteId } = req.body;
  
      // Validar campos requeridos
      if (!nombre || !descripcion || !fechaInicio || !meta || !clienteId) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
      }
  
      // Obtener el ID del trainer desde el token
      const trainerId = req.user.id;
  
      // Verificar si el cliente existe y está asociado al trainer
      const cliente = await Client.findById(clienteId);
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
  
      if (cliente.trainer.toString() !== trainerId) {
        return res.status(403).json({ message: 'No tienes permiso para asignar este cliente al planning.' });
      }
  
      // Crear solo una semana por defecto
      const weekNum = 1;
      const weekStartDate = new Date(fechaInicio);
      weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);
  
      const daysMap = {};
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
      for (const dia of dias) {
        const dayDate = new Date(weekStartDate);
        const dayOffset = dias.indexOf(dia);
        dayDate.setDate(weekStartDate.getDate() + dayOffset);
  
        const newDayPlan = new DayPlan({
          day: dia,
          fecha: dayDate,
          sessions: [],
        });
        await newDayPlan.save();
        daysMap[dia] = newDayPlan._id;
      }
  
      const newWeekPlan = new WeekPlan({
        weekNumber: weekNum,
        startDate: weekStartDate,
        days: daysMap,
      });
      await newWeekPlan.save();
  
      const newPlanning = new Planning({
        nombre,
        descripcion,
        fechaInicio,
        meta,
        semanas: semanas > 1 ? semanas : 1, // Asegurarse de que al menos una semana
        plan: [newWeekPlan._id],
        cliente: clienteId,
        trainer: trainerId,
        updatedAt: new Date(),
      });
  
      await newPlanning.save();
  
      res.status(201).json(newPlanning);
    } catch (error) {
      console.error("createPlanning - Error:", error);
      res.status(500).json({ message: 'Error al crear el planning', error });
    }
  };
  
// Actualizar un planning existente
const updatePlanning = async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, fechaInicio, meta, semanas, clienteId } = req.body;
  
      console.log(`Received request to update planning with ID: ${id}`);
  
      // Validar ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('Invalid planning ID');
        return res.status(400).json({ message: 'ID de planning inválido' });
      }
  
      const planning = await Planning.findById(id);
      if (!planning) {
        console.log('Planning not found');
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
  
      console.log(`Authenticated user ID: ${req.user.id}`);
      console.log(`Planning trainer ID: ${planning.trainer}`);
  
      // Verificar que el trainer del planning coincida con el entrenador autenticado
      if (planning.trainer.toString() !== req.user.id) {
        console.log('Trainer ID does not match authenticated user ID');
        return res.status(403).json({ message: 'No tienes permiso para actualizar este planning.' });
      }
  
      // Actualizar campos si están presentes
      planning.nombre = nombre || planning.nombre;
      planning.descripcion = descripcion || planning.descripcion;
      planning.fechaInicio = fechaInicio || planning.fechaInicio;
      planning.meta = meta || planning.meta;
      planning.semanas = semanas || planning.semanas;
  
      // Si se proporciona un nuevo cliente, verificar su existencia y asociación
      if (clienteId) {
        const cliente = await Client.findById(clienteId);
        if (!cliente) {
          console.log('Cliente not found');
          return res.status(404).json({ message: 'Cliente no encontrado' });
        }
  
        if (cliente.trainer.toString() !== req.user.id) {
          console.log('Cliente trainer ID does not match authenticated user ID');
          return res.status(403).json({ message: 'No tienes permiso para asignar este cliente al planning.' });
        }
  
        planning.cliente = clienteId;
      }
  
      planning.updatedAt = new Date();
  
      await planning.save();
  
      console.log('Planning updated successfully');
      res.status(200).json(planning);
    } catch (error) {
      console.error("updatePlanning - Error:", error);
      res.status(500).json({ message: 'Error al actualizar el planning', error });
    }
  };
    
  // Eliminar un planning
  const deletePlanning = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Validar ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID de planning inválido' });
      }
  
      const planning = await Planning.findById(id);
      if (!planning) {
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
  
      // Verificar que el trainer del planning coincida con el entrenador autenticado
      if (planning.trainer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar este planning.' });
      }
  
      await Planning.findByIdAndDelete(id);
  
      // Opcional: Eliminar WeekPlans, DayPlans, etc., asociados al Planning
      // Esto depende de cómo quieras manejar la eliminación en cascada
  
      res.status(200).json({ message: 'Planning eliminado correctamente' });
    } catch (error) {
      console.error("deletePlanning - Error:", error);
      res.status(500).json({ message: 'Error al eliminar el planning', error });
    }
  };
  
  // Obtener solo los plannings sin las semanas ni subdocumentos
  const getAllPlanningSchemas = async (req, res) => {
    try {
      const trainerId = req.user.id; // Obtener el ID del entrenador autenticado
  
      // Buscar planificaciones que pertenezcan al entrenador autenticado
      const plannings = await Planning.find({ trainer: trainerId })
        .select('nombre descripcion fechaInicio meta semanas cliente trainer updatedAt createdAt')
        .exec();
  
      res.status(200).json(plannings);
    } catch (error) {
      console.error("getAllPlanningSchemas - Error:", error);
      res.status(500).json({ message: 'Error al obtener los plannings', error });
    }
  };
    // Añadir un CheckIn a un Set
  const addCheckInToSet = async (req, res) => {
    try {
      const { setId } = req.params;
      const { color, comentario } = req.body;
  
      // Validar campos requeridos
      if (!color) {
        return res.status(400).json({ message: 'El campo color es requerido' });
      }
  
      // Validar ID de Set
      if (!mongoose.Types.ObjectId.isValid(setId)) {
        return res.status(400).json({ message: 'ID de Set inválido' });
      }
  
      const set = await Set.findById(setId);
      if (!set) {
        return res.status(404).json({ message: 'Set no encontrado' });
      }
  
      // Verificar que el set pertenezca a un ejercicio, sesión, día, semana y planning que pertenece al trainer autenticado
      // Esto requiere navegaciones adicionales; para simplificar, asumimos que el set pertenece al trainer autenticado
  
      const newCheckIn = new CheckIn({
        color,
        comentario: comentario || '',
        fecha: new Date(),
      });
  
      await newCheckIn.save();
  
      set.checkIns.push(newCheckIn._id);
      await set.save();
  
      res.status(201).json(newCheckIn);
    } catch (error) {
      console.error("addCheckInToSet - Error:", error);
      res.status(500).json({ message: 'Error al añadir el CheckIn', error });
    }
  };
  
  // Obtener todos los CheckIns de un Set
  const getCheckInsForSet = async (req, res) => {
    try {
      const { setId } = req.params;
  
      // Validar ID de Set
      if (!mongoose.Types.ObjectId.isValid(setId)) {
        return res.status(400).json({ message: 'ID de Set inválido' });
      }
  
      const set = await Set.findById(setId).populate('checkIns').exec();
      if (!set) {
        return res.status(404).json({ message: 'Set no encontrado' });
      }
  
      // Opcional: Verificar que el set pertenezca a un planning del trainer autenticado
      // Para mayor seguridad, se debería navegar desde el set hasta el planning y verificar el trainer
  
      res.status(200).json(set.checkIns);
    } catch (error) {
      console.error("getCheckInsForSet - Error:", error);
      res.status(500).json({ message: 'Error al obtener los CheckIns', error });
    }
  };
  
  // Añadir una nueva semana al planning
  const addNextWeek = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('1. ID recibido:', id);
      console.log('2. Tipo de ID:', typeof id);
      
      // Verificar si el ID es válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('3. ID no válido según mongoose');
        return res.status(400).json({ message: 'ID de planning no válido' });
      }
      
      console.log('4. Buscando planning con ID:', id);
      // Buscar el planning y poblarlo con sus semanas
      const planning = await Planning.findById(id).populate('plan');
      console.log('5. Planning encontrado:', planning ? 'Sí' : 'No');
      
      if (!planning) {
        console.log('6. Planning no encontrado en la base de datos');
        return res.status(404).json({ message: 'Planning no encontrado' });
      }

      console.log('7. Plan actual:', planning.plan);
      console.log('8. Número de semanas actuales:', planning.plan.length);

      // Crear una nueva semana
      const newWeek = new WeekPlan({
        weekNumber: planning.plan.length + 1,
        days: Array.from({ length: 7 }, () => new DayPlan({
          sessions: [] // Inicialmente sin sesiones
        }))
      });
      console.log('9. Nueva semana creada:', newWeek);

      // Añadir la nueva semana al planning
      planning.plan.push(newWeek);
      console.log('10. Semana añadida al planning');
      console.log('11. Planning antes de guardar:', planning);

      const savedPlanning = await planning.save();
      console.log('12. Planning guardado correctamente');
      console.log('13. Planning guardado:', savedPlanning);

      console.log('14. Iniciando población de datos...');
      // Poblar la nueva semana para devolverla con todos sus datos
      await planning.populate({
        path: 'plan',
        populate: {
          path: 'days',
          populate: {
            path: 'sessions',
            populate: {
              path: 'exercises',
              populate: {
                path: 'sets',
                populate: 'checkIns'
              }
            }
          }
        }
      });
      console.log('15. Datos poblados correctamente');

      // Devolver la nueva semana
      const addedWeek = planning.plan[planning.plan.length - 1];
      console.log('16. Semana a devolver:', addedWeek);
      
      res.status(201).json(addedWeek);
    } catch (error) {
      console.error("addNextWeek - Error detallado:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ 
        message: 'Error al añadir nueva semana', 
        error: error.message,
        type: error.name,
        stack: error.stack 
      });
    }
  };
  
  module.exports = {
    getAllPlannings,
    getPlanningById,
    createPlanning,
    updatePlanning,
    deletePlanning,
    getAllPlanningSchemas,
    addCheckInToSet,
    getCheckInsForSet,
    addNextWeek
  };
  