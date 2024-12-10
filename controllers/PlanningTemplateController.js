const mongoose = require('mongoose');
const PlanningTemplate = require('../models/PlanningTemplate');
const Exercise = require('../models/Exercise');
const Client = require('../models/Client');
const {
  Planning,
  WeekPlan,
  DayPlan,
  Session,
  PlanningExercise,
  Set,
  CheckIn,
} = require('../models/Planning');

// Obtener todas las plantillas
const getAllTemplates = async (req, res) => {
  try {
    console.log(' [getAllTemplates] Obteniendo todas las plantillas');
    
    const templates = await PlanningTemplate.find()
      .populate('trainer', 'nombre email especialidad')
      .populate({
        path: 'plan.days.sessions.exercises.exercise',
        model: 'Exercise'
      })
      .populate({
        path: 'assignedClients.client',
        model: 'Client',
        select: 'nombre email'
      });

    console.log(` [getAllTemplates] Se encontraron ${templates.length} plantillas`);
    res.status(200).json(templates);
  } catch (error) {
    console.error(' [getAllTemplates] Error:', error);
    res.status(500).json({ 
      message: 'Error al obtener las plantillas',
      error: error.message,
      stack: error.stack
    });
  }
};

// Obtener una plantilla por ID
const getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    console.log(` [getTemplateById] Buscando plantilla con ID: ${templateId}`);

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [getTemplateById] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    const template = await PlanningTemplate.findById(templateId)
      .populate('trainer', 'nombre email especialidad')
      .populate({
        path: 'plan.days.sessions.exercises.exercise',
        model: 'Exercise'
      })
      .populate({
        path: 'assignedClients.client',
        model: 'Client',
        select: 'nombre email'
      });

    if (!template) {
      console.log(` [getTemplateById] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    console.log(' [getTemplateById] Plantilla encontrada');
    res.status(200).json(template);
  } catch (error) {
    console.error(' [getTemplateById] Error:', error);
    res.status(500).json({ 
      message: 'Error al obtener la plantilla',
      error: error.message,
      stack: error.stack
    });
  }
};

// Obtener plantilla con datos básicos (sin poblar ejercicios)
const getTemplateBasicData = async (req, res) => {
  try {
    const { templateId } = req.params;
    console.log(` [getTemplateBasicData] Buscando plantilla con ID: ${templateId}`);

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [getTemplateBasicData] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    const template = await PlanningTemplate.findById(templateId)
      .populate('trainer', 'nombre email especialidad')
      .select('nombre descripcion trainer totalWeeks plan.weekNumber plan.days.dayNumber plan.days._id isActive tags difficulty category createdAt updatedAt');

    if (!template) {
      console.log(` [getTemplateBasicData] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    console.log(' [getTemplateBasicData] Plantilla encontrada');
    res.status(200).json({
      message: 'Datos básicos de la plantilla obtenidos exitosamente',
      template: {
        _id: template._id,
        nombre: template.nombre,
        descripcion: template.descripcion,
        trainer: template.trainer,
        totalWeeks: template.totalWeeks,
        plan: template.plan.map(week => ({
          weekNumber: week.weekNumber,
          days: week.days.map(day => ({
            dayNumber: day.dayNumber,
            _id: day._id,
            sessionCount: day.sessions ? day.sessions.length : 0
          }))
        })),
        isActive: template.isActive,
        tags: template.tags,
        difficulty: template.difficulty,
        category: template.category,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }
    });
  } catch (error) {
    console.error(' [getTemplateBasicData] Error:', error);
    res.status(500).json({ 
      message: 'Error al obtener los datos básicos de la plantilla',
      error: error.message,
      stack: error.stack
    });
  }
};

// Crear una nueva plantilla
const createTemplate = async (req, res) => {
  try {
    const { nombre, descripcion, meta, otraMeta, semanas } = req.body;
    const trainer = req.user.id; // Obtenemos el trainer del token

    // Validar campos requeridos
    if (!nombre || !descripcion || !meta || !semanas) {
      console.log(' [createTemplate] Faltan campos requeridos');
      return res.status(400).json({ 
        message: 'Nombre, descripción, meta y número de semanas son requeridos' 
      });
    }

    // Validar meta personalizada
    if (meta === 'Otra' && !otraMeta) {
      return res.status(400).json({ 
        message: 'Debe especificar una meta personalizada cuando selecciona "Otra"' 
      });
    }

    // Crear estructura base con el número de semanas especificado
    const plan = [];
    for (let weekNumber = 1; weekNumber <= semanas; weekNumber++) {
      const days = [];
      for (let dayNumber = 1; dayNumber <= 7; dayNumber++) {
        days.push({
          dayNumber,
          sessions: []
        });
      }
      plan.push({
        weekNumber,
        days
      });
    }

    const template = new PlanningTemplate({
      nombre,
      descripcion,
      trainer,
      meta,
      otraMeta: meta === 'Otra' ? otraMeta : undefined,
      semanas,
      plan
    });

    await template.save();
    console.log(` [createTemplate] Plantilla creada con ID: ${template._id}`);

    res.status(201).json({
      message: 'Plantilla creada exitosamente',
      template: {
        _id: template._id,
        nombre: template.nombre,
        descripcion: template.descripcion,
        trainer: template.trainer,
        meta: template.meta,
        otraMeta: template.otraMeta,
        semanas: template.semanas,
        plan: template.plan
      }
    });
  } catch (error) {
    console.error(' [createTemplate] Error:', error);
    res.status(500).json({ 
      message: 'Error al crear la plantilla',
      error: error.message,
      stack: error.stack
    });
  }
};

// Actualizar una plantilla
const updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = req.body;
    
    console.log(` [updateTemplate] Actualizando plantilla: ${templateId}`);
    console.log(' [updateTemplate] Datos de actualización:', updateData);

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [updateTemplate] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    // Actualizar fecha de modificación
    updateData.updatedAt = new Date();

    const template = await PlanningTemplate.findByIdAndUpdate(
      templateId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!template) {
      console.log(` [updateTemplate] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    console.log(' [updateTemplate] Plantilla actualizada exitosamente');
    res.status(200).json({
      message: 'Plantilla actualizada exitosamente',
      template
    });
  } catch (error) {
    console.error(' [updateTemplate] Error:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la plantilla',
      error: error.message,
      stack: error.stack
    });
  }
};

// Eliminar una plantilla
const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    console.log(` [deleteTemplate] Eliminando plantilla: ${templateId}`);

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [deleteTemplate] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    const template = await PlanningTemplate.findByIdAndDelete(templateId);

    if (!template) {
      console.log(` [deleteTemplate] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    console.log(' [deleteTemplate] Plantilla eliminada exitosamente');
    res.status(200).json({
      message: 'Plantilla eliminada exitosamente',
      template
    });
  } catch (error) {
    console.error(' [deleteTemplate] Error:', error);
    res.status(500).json({ 
      message: 'Error al eliminar la plantilla',
      error: error.message,
      stack: error.stack
    });
  }
};

// Clonar una plantilla
const cloneTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { newName } = req.body;
    
    console.log(` [cloneTemplate] Clonando plantilla: ${templateId}`);
    console.log(' [cloneTemplate] Nuevo nombre:', newName);

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [cloneTemplate] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    if (!newName) {
      console.log(' [cloneTemplate] Nombre nuevo requerido');
      return res.status(400).json({ message: 'Se requiere un nuevo nombre para la plantilla' });
    }

    const originalTemplate = await PlanningTemplate.findById(templateId);
    if (!originalTemplate) {
      console.log(` [cloneTemplate] Plantilla original no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla original no encontrada' });
    }

    const clonedTemplate = await originalTemplate.clone(newName);
    
    console.log(' [cloneTemplate] Plantilla clonada exitosamente');
    res.status(201).json({
      message: 'Plantilla clonada exitosamente',
      template: clonedTemplate
    });
  } catch (error) {
    console.error(' [cloneTemplate] Error:', error);
    res.status(500).json({ 
      message: 'Error al clonar la plantilla',
      error: error.message,
      stack: error.stack
    });
  }
};

// Asignar un cliente a una plantilla y crear su planificación
const assignClient = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { clientId } = req.body;
    const fechaInicio = new Date(); // Usar la fecha actual
    
    console.log('\n=== Iniciando assignClient ===');
    console.log('Datos recibidos:', { templateId, clientId, fechaInicio });

    if (!mongoose.Types.ObjectId.isValid(templateId) || !mongoose.Types.ObjectId.isValid(clientId)) {
      console.log('Error: IDs inválidos');
      return res.status(400).json({ message: 'ID de plantilla o cliente inválido' });
    }

    // Buscar la plantilla
    console.log('Buscando plantilla...');
    const template = await PlanningTemplate.findById(templateId)
      .populate({
        path: 'plan.days.sessions.exercises.exercise',
        model: 'Exercise'
      });

    if (!template) {
      console.log('Error: Plantilla no encontrada');
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    // Verificar el cliente
    console.log('Verificando cliente...');
    const client = await Client.findById(clientId);
    if (!client) {
      console.log('Error: Cliente no encontrado');
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Verificar si el cliente ya está asignado
    const isAlreadyAssigned = template.assignedClients.some(
      ac => ac.client.toString() === clientId
    );

    if (isAlreadyAssigned) {
      console.log('Error: Cliente ya asignado');
      return res.status(400).json({ message: 'El cliente ya está asignado a esta plantilla' });
    }

    // Crear la planificación para el cliente
    console.log('Creando planificación para el cliente...');
    
    const weekPlanIds = [];
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Ajustar la fecha de inicio al próximo lunes
    const startDate = new Date(fechaInicio);
    const currentDay = startDate.getDay();
    const daysUntilMonday = currentDay === 0 ? 1 : 8 - currentDay; // Si es domingo (0), suma 1, sino resta de 8
    startDate.setDate(startDate.getDate() + daysUntilMonday);
    startDate.setHours(0, 0, 0, 0); // Establecer a inicio del día

    console.log('Fecha de inicio ajustada al próximo lunes:', startDate);

    // Crear las semanas basadas en la plantilla
    for (const templateWeek of template.plan) {
      console.log(`Procesando semana ${templateWeek.weekNumber}...`);
      
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + (templateWeek.weekNumber - 1) * 7);
      
      const daysMap = {};

      // Crear los días para cada semana
      for (const dia of dias) {
        const dayDate = new Date(weekStartDate);
        const dayOffset = dias.indexOf(dia);
        dayDate.setDate(weekStartDate.getDate() + dayOffset);

        // Encontrar el día correspondiente en la plantilla
        const templateDay = templateWeek.days.find(d => d.dayNumber === dias.indexOf(dia) + 1);
        
        // Crear las sesiones para el día
        let sessions = [];
        if (templateDay && templateDay.sessions) {
          sessions = await Promise.all(templateDay.sessions.map(async templateSession => {
            // Crear los ejercicios de la sesión
            const exercises = await Promise.all(templateSession.exercises.map(async templateExercise => {
              // Crear los sets exactamente como están en la plantilla
              const sets = templateExercise.sets.map(set => new Set({
                reps: set.reps,
                weight: set.weight,
                weightType: set.weightType,
                rest: set.rest,
                tempo: set.tempo,
                rpe: set.rpe,
                renderConfig: {
                  campo1: set.renderConfig?.campo1 || 'reps',
                  campo2: set.renderConfig?.campo2 || 'weight',
                  campo3: set.renderConfig?.campo3 || 'rest'
                }
              }));

              // Crear el ejercicio con toda su información
              return new PlanningExercise({
                exercise: templateExercise.exercise._id,
                sets: sets,
                renderConfig: templateExercise.renderConfig
              });
            }));

            // Crear la nueva sesión con todos sus atributos
            return new Session({
              name: templateSession.name,
              tipo: templateSession.tipo,
              rondas: templateSession.rondas,
              exercises: exercises,
              notes: templateSession.notes,
              order: templateSession.order
            });
          }));
        }

        // Crear el día con sus sesiones
        const newDayPlan = new DayPlan({
          day: dia,
          fecha: dayDate,
          sessions: sessions
        });

        await newDayPlan.save();
        daysMap[dia] = newDayPlan._id;
      }

      // Crear la semana y guardarla
      const newWeekPlan = new WeekPlan({
        weekNumber: templateWeek.weekNumber,
        startDate: weekStartDate,
        days: daysMap,
      });
      
      await newWeekPlan.save();
      weekPlanIds.push(newWeekPlan._id);
    }

    // Crear el planning completo
    const newPlanning = new Planning({
      nombre: `${template.nombre} - ${client.nombre}`,
      descripcion: template.descripcion,
      fechaInicio: startDate,
      meta: 'Basado en plantilla',
      semanas: template.totalWeeks,
      plan: weekPlanIds,
      cliente: clientId,
      trainer: req.user.id,
      tipo: 'Planificacion',
      updatedAt: new Date(),
    });

    await newPlanning.save();

    // Actualizar el array de plannings del cliente
    console.log('Actualizando plannings del cliente...');
    await Client.findByIdAndUpdate(
      clientId,
      { $push: { plannings: newPlanning._id } },
      { new: true }
    );

    // Asignar el cliente a la plantilla
    await template.assignClient(clientId);
    
    console.log('Proceso completado exitosamente');
    res.status(200).json({
      message: 'Cliente asignado y planificación creada exitosamente',
      planning: newPlanning,
      template: {
        _id: template._id,
        nombre: template.nombre,
        assignedClients: template.assignedClients
      }
    });
  } catch (error) {
    console.error('Error en assignClient:', error);
    res.status(500).json({ 
      message: 'Error al asignar el cliente y crear la planificación',
      error: error.message,
      stack: error.stack
    });
  }
};

// Modificar ejercicio para un cliente específico
const modifyClientExercise = async (req, res) => {
  try {
    const { templateId, clientId } = req.params;
    const { weekNumber, dayNumber, sessionIndex, exerciseIndex, setIndex, modifications } = req.body;
    
    console.log(' [modifyClientExercise] Modificando ejercicio para cliente');
    console.log(' [modifyClientExercise] Datos:', {
      templateId,
      clientId,
      weekNumber,
      dayNumber,
      sessionIndex,
      exerciseIndex,
      setIndex,
      modifications
    });

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(templateId) || !mongoose.Types.ObjectId.isValid(clientId)) {
      console.log(' [modifyClientExercise] ID inválido');
      return res.status(400).json({ message: 'ID de plantilla o cliente inválido' });
    }

    // Validar datos requeridos
    if (!weekNumber || !dayNumber || sessionIndex === undefined || 
        exerciseIndex === undefined || setIndex === undefined || !modifications) {
      console.log(' [modifyClientExercise] Faltan datos requeridos');
      return res.status(400).json({
        message: 'Datos incompletos',
        required: ['weekNumber', 'dayNumber', 'sessionIndex', 'exerciseIndex', 'setIndex', 'modifications'],
        received: { weekNumber, dayNumber, sessionIndex, exerciseIndex, setIndex, hasModifications: !!modifications }
      });
    }

    const template = await PlanningTemplate.findById(templateId);
    if (!template) {
      console.log(` [modifyClientExercise] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    await template.modifyClientExercise(
      clientId,
      weekNumber,
      dayNumber,
      sessionIndex,
      exerciseIndex,
      setIndex,
      modifications
    );

    console.log(' [modifyClientExercise] Ejercicio modificado exitosamente');
    res.status(200).json({
      message: 'Ejercicio modificado exitosamente para el cliente',
      template
    });
  } catch (error) {
    console.error(' [modifyClientExercise] Error:', error);
    res.status(500).json({ 
      message: 'Error al modificar el ejercicio',
      error: error.message,
      stack: error.stack
    });
  }
};

// Crear una sesión en un día específico de una plantilla
const createTemplateSession = async (req, res) => {
  try {
    const { templateId, weekNumber, dayNumber } = req.params;
    const { name, tipo = 'Normal', rondas = 1, exercises = [] } = req.body;

    console.log(' [createTemplateSession] Creando nueva sesión en plantilla');
    console.log(' [createTemplateSession] Datos:', {
      templateId, weekNumber, dayNumber,
      sessionData: { name, tipo, rondas }
    });

    // Validar datos requeridos
    if (!name) {
      console.log(' [createTemplateSession] Falta el nombre de la sesión');
      return res.status(400).json({
        message: 'El nombre de la sesión es requerido'
      });
    }

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [createTemplateSession] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    const template = await PlanningTemplate.findById(templateId);
    if (!template) {
      console.log(` [createTemplateSession] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    // Encontrar la semana y el día
    const week = template.plan.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      console.log(` [createTemplateSession] Semana no encontrada: ${weekNumber}`);
      return res.status(404).json({ message: 'Semana no encontrada' });
    }

    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log(` [createTemplateSession] Día no encontrado: ${dayNumber}`);
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    // Crear la nueva sesión
    const newSession = {
      name,
      tipo,
      rondas,
      exercises: exercises.map(exercise => ({
        exercise: exercise.exerciseId,
        sets: exercise.sets || []
      }))
    };

    // Añadir la sesión al día
    day.sessions.push(newSession);

    // Guardar cambios
    console.log(' [createTemplateSession] Guardando cambios');
    await template.save();

    console.log(' [createTemplateSession] Sesión creada exitosamente');
    res.status(201).json({
      message: 'Sesión creada exitosamente',
      session: newSession,
      location: {
        weekNumber,
        dayNumber,
        sessionIndex: day.sessions.length - 1
      }
    });
  } catch (error) {
    console.error(' [createTemplateSession] Error:', error);
    res.status(500).json({
      message: 'Error al crear la sesión',
      error: error.message,
      stack: error.stack
    });
  }
};

// Añadir ejercicio a una sesión de la plantilla
const addExerciseToTemplateSession = async (req, res) => {
  try {
    console.log('\n=== Iniciando addExerciseToTemplateSession ===');
    const { templateId, weekNumber, dayNumber, sessionIndex } = req.params;
    const { exerciseId, sets } = req.body;

    console.log('Parámetros recibidos:', {
      templateId,
      weekNumber,
      dayNumber,
      sessionIndex,
      exerciseId,
      setsCount: sets?.length || 0
    });

    // Validar ID de plantilla
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log('Error: ID de plantilla inválido:', templateId);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    // Validar ID de ejercicio
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      console.log('Error: ID de ejercicio inválido:', exerciseId);
      return res.status(400).json({ message: 'ID de ejercicio inválido' });
    }

    // Validar sets
    if (!sets || !Array.isArray(sets) || sets.length === 0) {
      console.log('Error: Sets inválidos:', sets);
      return res.status(400).json({ message: 'Se requiere al menos un set de ejercicio' });
    }

    // Validar cada set
    for (const set of sets) {
      if (!set.reps || !set.weight || !set.weightType || !set.rest || !set.tempo || !set.rpe) {
        console.log('Error: Set incompleto:', set);
        return res.status(400).json({ 
          message: 'Cada set debe incluir: reps, weight, weightType, rest, tempo y rpe',
          receivedSet: set
        });
      }
    }

    console.log('Buscando plantilla...');
    const template = await PlanningTemplate.findById(templateId);
    
    if (!template) {
      console.log('Error: Plantilla no encontrada:', templateId);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    console.log('Verificando semana y día...');
    const week = template.plan.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      console.log('Error: Semana no encontrada:', weekNumber);
      return res.status(404).json({ message: 'Semana no encontrada' });
    }

    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log('Error: Día no encontrado:', dayNumber);
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    console.log('Verificando sesión...');
    if (!day.sessions) {
      console.log('Error: No hay sesiones en este día');
      return res.status(404).json({ message: 'No hay sesiones en este día' });
    }

    // Buscar la sesión por su ID
    const sessionIdToFind = sessionIndex;
    console.log('Buscando sesión con ID:', sessionIdToFind);
    const session = day.sessions.find(s => s._id.toString() === sessionIdToFind);

    if (!session) {
      console.log('Error: Sesión no encontrada con ID:', sessionIdToFind);
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    console.log('Sesión encontrada:', session);

    console.log('Verificando que el ejercicio existe...');
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      console.log('Error: Ejercicio no encontrado:', exerciseId);
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    console.log('Añadiendo ejercicio a la sesión...');
    if (!session.exercises) {
      session.exercises = [];
    }

    session.exercises.push({
      exercise: exerciseId,
      sets: sets
    });

    console.log('Guardando cambios...');
    await template.save();

    console.log('Ejercicio añadido exitosamente');
    res.status(200).json({
      message: 'Ejercicio añadido exitosamente a la sesión',
      sessionUpdated: {
        weekNumber,
        dayNumber,
        sessionId: session._id,
        exerciseAdded: {
          exerciseId,
          setsCount: sets.length
        }
      }
    });

  } catch (error) {
    console.error('Error en addExerciseToTemplateSession:', error);
    res.status(500).json({ 
      message: 'Error al añadir ejercicio a la sesión',
      error: error.message,
      stack: error.stack
    });
  }
};

// Actualizar una sesión de la plantilla
const updateTemplateSession = async (req, res) => {
  try {
    const { templateId, weekNumber, dayNumber, sessionIndex } = req.params;
    const updateData = req.body;

    console.log(' [updateTemplateSession] Actualizando sesión');
    console.log(' [updateTemplateSession] Datos:', {
      templateId, weekNumber, dayNumber, sessionIndex,
      updateData
    });

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [updateTemplateSession] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    const template = await PlanningTemplate.findById(templateId);
    if (!template) {
      console.log(` [updateTemplateSession] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    // Encontrar y actualizar la sesión
    const week = template.plan.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      console.log(` [updateTemplateSession] Semana no encontrada: ${weekNumber}`);
      return res.status(404).json({ message: 'Semana no encontrada' });
    }

    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log(` [updateTemplateSession] Día no encontrado: ${dayNumber}`);
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    if (!day.sessions[sessionIndex]) {
      console.log(` [updateTemplateSession] Sesión no encontrada: ${sessionIndex}`);
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    // Actualizar campos permitidos
    if (updateData.name) day.sessions[sessionIndex].name = updateData.name;
    if (updateData.tipo) day.sessions[sessionIndex].tipo = updateData.tipo;
    if (updateData.rondas) day.sessions[sessionIndex].rondas = updateData.rondas;

    // Guardar cambios
    console.log(' [updateTemplateSession] Guardando cambios');
    await template.save();

    console.log(' [updateTemplateSession] Sesión actualizada exitosamente');
    res.status(200).json({
      message: 'Sesión actualizada exitosamente',
      session: day.sessions[sessionIndex]
    });
  } catch (error) {
    console.error(' [updateTemplateSession] Error:', error);
    res.status(500).json({
      message: 'Error al actualizar la sesión',
      error: error.message,
      stack: error.stack
    });
  }
};

// Eliminar una sesión de la plantilla
const deleteTemplateSession = async (req, res) => {
  try {
    const { templateId, weekNumber, dayNumber, sessionIndex } = req.params;

    console.log(' [deleteTemplateSession] Eliminando sesión');
    console.log(' [deleteTemplateSession] Datos:', {
      templateId, weekNumber, dayNumber, sessionIndex
    });

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [deleteTemplateSession] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    const template = await PlanningTemplate.findById(templateId);
    if (!template) {
      console.log(` [deleteTemplateSession] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    // Encontrar y eliminar la sesión
    const week = template.plan.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      console.log(` [deleteTemplateSession] Semana no encontrada: ${weekNumber}`);
      return res.status(404).json({ message: 'Semana no encontrada' });
    }

    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log(` [deleteTemplateSession] Día no encontrado: ${dayNumber}`);
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    if (!day.sessions[sessionIndex]) {
      console.log(` [deleteTemplateSession] Sesión no encontrada: ${sessionIndex}`);
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    // Eliminar la sesión
    const deletedSession = day.sessions.splice(sessionIndex, 1)[0];

    // Guardar cambios
    console.log(' [deleteTemplateSession] Guardando cambios');
    await template.save();

    console.log(' [deleteTemplateSession] Sesión eliminada exitosamente');
    res.status(200).json({
      message: 'Sesión eliminada exitosamente',
      session: deletedSession
    });
  } catch (error) {
    console.error(' [deleteTemplateSession] Error:', error);
    res.status(500).json({
      message: 'Error al eliminar la sesión',
      error: error.message,
      stack: error.stack
    });
  }
};

// Actualizar un ejercicio en una sesión de la plantilla
const updateTemplateExercise = async (req, res) => {
  try {
    const { templateId, weekNumber, dayNumber, sessionIndex, exerciseIndex } = req.params;
    const updateData = req.body;

    console.log(' [updateTemplateExercise] Actualizando ejercicio');
    console.log(' [updateTemplateExercise] Datos:', {
      templateId, weekNumber, dayNumber, sessionIndex, exerciseIndex,
      updateData
    });

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      console.log(` [updateTemplateExercise] ID de plantilla inválido: ${templateId}`);
      return res.status(400).json({ message: 'ID de plantilla inválido' });
    }

    const template = await PlanningTemplate.findById(templateId);
    if (!template) {
      console.log(` [updateTemplateExercise] Plantilla no encontrada: ${templateId}`);
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    // Encontrar el ejercicio
    const week = template.plan.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      console.log(` [updateTemplateExercise] Semana no encontrada: ${weekNumber}`);
      return res.status(404).json({ message: 'Semana no encontrada' });
    }

    const day = week.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      console.log(` [updateTemplateExercise] Día no encontrado: ${dayNumber}`);
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    const session = day.sessions[sessionIndex];
    if (!session) {
      console.log(` [updateTemplateExercise] Sesión no encontrada: ${sessionIndex}`);
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    const exercise = session.exercises[exerciseIndex];
    if (!exercise) {
      console.log(` [updateTemplateExercise] Ejercicio no encontrado: ${exerciseIndex}`);
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    // Actualizar campos del ejercicio
    if (updateData.sets) {
      exercise.sets = updateData.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        weightType: set.weightType || exercise.sets[0]?.weightType || 'absolute',
        rmPercentage: set.rmPercentage,
        rest: set.rest,
        tempo: set.tempo,
        rpe: set.rpe,
        rir: set.rir,
        renderConfig: set.renderConfig || exercise.sets[0]?.renderConfig || {
          campo1: 'reps',
          campo2: 'weight',
          campo3: 'rest'
        }
      }));
    }

    // Guardar cambios
    console.log(' [updateTemplateExercise] Guardando cambios');
    await template.save();

    console.log(' [updateTemplateExercise] Ejercicio actualizado exitosamente');
    res.status(200).json({
      message: 'Ejercicio actualizado exitosamente',
      exercise
    });
  } catch (error) {
    console.error(' [updateTemplateExercise] Error:', error);
    res.status(500).json({
      message: 'Error al actualizar el ejercicio',
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  getTemplateBasicData,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  cloneTemplate,
  assignClient,
  modifyClientExercise,
  createTemplateSession,
  addExerciseToTemplateSession,
  updateTemplateSession,
  deleteTemplateSession,
  updateTemplateExercise
};
