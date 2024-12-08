// src/controllers/planningController.js
const mongoose = require('mongoose');
const {
  Planning,
  WeekPlan,
  DayPlan,
  Session,
  PlanningExercise,
  Set,
  CheckIn,
} = require('../models/Planning');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer');
const Exercise = require('../models/Exercise');

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
                populate: [{
                  path: 'exercise',
                  select: 'nombre grupoMuscular descripcion equipo imgUrl'
                }, {
                  path: 'sets',
                  populate: 'checkIns'
                }]
              }
            }
          }
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
                populate: [
                  {
                    path: 'exercise',
                    select: 'nombre grupoMuscular descripcion equipo imgUrl'
                  },
                  {
                    path: 'sets',
                    populate: {
                      path: 'checkIns'
                    }
                  }
                ]
              }
            }
          }
        });

      if (!planning) {
        return res.status(404).json({ message: 'Planning no encontrado' });
      }

      res.status(200).json(planning);
    } catch (error) {
      console.error("getPlanningById - Error:", error);
      res.status(500).json({ message: 'Error al obtener el planning', error: error.message });
    }
  };
  
  // Crear un nuevo planning con múltiples semanas
  const createPlanning = async (req, res) => {
    try {
      const { nombre, descripcion, fechaInicio, meta, semanas = 1, clienteId, tipo = 'Planificacion' } = req.body;

      // Validar campos requeridos
      if (!nombre || !descripcion || !fechaInicio || !meta) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
      }

      // Validar tipo
      if (tipo && !['Planificacion', 'Plantilla'].includes(tipo)) {
        return res.status(400).json({ message: 'El tipo debe ser "Planificacion" o "Plantilla"' });
      }

      // Obtener el ID del trainer desde el token
      const trainerId = req.user.id;

      // Verificar si el cliente existe y está asociado al trainer solo si se proporciona clienteId
      let cliente;
      if (clienteId) {
        cliente = await Client.findById(clienteId);
        if (!cliente) {
          return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        if (cliente.trainer.toString() !== trainerId) {
          return res.status(403).json({ message: 'Este cliente no está asociado a tu cuenta' });
        }
      }

      // Array para almacenar los IDs de todas las semanas creadas
      const weekPlanIds = [];
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

      // Crear las semanas especificadas
      for (let weekNum = 1; weekNum <= semanas; weekNum++) {
        // Calcular la fecha de inicio de cada semana
        const weekStartDate = new Date(fechaInicio);
        weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);

        const daysMap = {};

        // Crear los días para cada semana
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

        // Crear la semana y guardarla
        const newWeekPlan = new WeekPlan({
          weekNumber: weekNum,
          startDate: weekStartDate,
          days: daysMap,
        });
        await newWeekPlan.save();
        weekPlanIds.push(newWeekPlan._id);
      }

      // Crear el planning con todas las semanas
      const newPlanning = new Planning({
        nombre,
        descripcion,
        fechaInicio,
        meta,
        semanas,
        plan: weekPlanIds,
        cliente: clienteId,
        trainer: trainerId,
        tipo,
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
      const { nombre, descripcion, fechaInicio, meta, semanas, clienteId, tipo } = req.body;
  
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
  
      // Validar tipo si se proporciona
      if (tipo && !['Planificacion', 'Plantilla'].includes(tipo)) {
        return res.status(400).json({ message: 'El tipo debe ser "Planificacion" o "Plantilla"' });
      }
  
      // Actualizar campos si están presentes
      planning.nombre = nombre || planning.nombre;
      planning.descripcion = descripcion || planning.descripcion;
      planning.fechaInicio = fechaInicio || planning.fechaInicio;
      planning.meta = meta || planning.meta;
      planning.semanas = semanas || planning.semanas;
      planning.tipo = tipo || planning.tipo;
  
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
        .select('nombre descripcion fechaInicio meta semanas cliente trainer tipo updatedAt createdAt')
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
                path: 'exercise',
                populate: {
                  path: 'sets',
                  populate: 'checkIns'
                }
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
  
  // Crear una sesión en un día específico
  const createSession = async (req, res) => {
    try {
      console.log('\n=== 🚀 INICIANDO CREACIÓN DE SESIÓN ===');
      const { planningId, weekNumber, day, sessionData } = req.body;
      console.log('📝 Datos recibidos:', { planningId, weekNumber, day, sessionData });

      // Validar que se proporcionen todos los campos necesarios
      if (!planningId || !weekNumber || !day || !sessionData || !sessionData.name || (!sessionData.tipo && !sessionData.type)) {
        console.log('❌ Error: Faltan campos requeridos');
        return res.status(400).json({
          message: 'Faltan campos requeridos. Se necesita planningId, weekNumber, day y sessionData con nombre y tipo'
        });
      }

      // Mapear los nombres de campos si es necesario
      const sessionDataMapped = {
        name: sessionData.name,
        tipo: sessionData.type || sessionData.tipo,
        rondas: sessionData.rounds || sessionData.rondas
      };

      // Validar tipo de sesión
      const tiposValidos = ['Normal', 'Superset'];
      if (!tiposValidos.includes(sessionDataMapped.tipo)) {
        console.log('❌ Error: Tipo de sesión inválido');
        return res.status(400).json({
          message: `Tipo de sesión inválido. Debe ser uno de: ${tiposValidos.join(' o ')}`
        });
      }

      // Validar rondas si se proporcionan
      if (sessionDataMapped.rondas !== undefined && (sessionDataMapped.rondas < 1 || !Number.isInteger(sessionDataMapped.rondas))) {
        console.log('❌ Error: Número de rondas inválido');
        return res.status(400).json({
          message: 'El número de rondas debe ser un número entero mayor o igual a 1'
        });
      }

      // Validar que el día sea válido
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      if (!dias.includes(day)) {
        console.log('❌ Error: Día inválido');
        return res.status(400).json({
          message: 'Día inválido. Debe ser uno de: ' + dias.join(', ') 
        });
      }

      // Buscar el planning
      console.log('🔍 Buscando planning...');
      const planning = await Planning.findById(planningId)
        .populate({
          path: 'plan',
          match: { weekNumber: weekNumber },
          populate: {
            path: 'days'
          }
        });

      if (!planning) {
        console.log('❌ Error: Planning no encontrado');
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
      console.log('✅ Planning encontrado');

      // Encontrar la semana específica
      const weekPlan = planning.plan.find(week => week.weekNumber === parseInt(weekNumber));
      if (!weekPlan) {
        console.log('❌ Error: Semana no encontrada');
        return res.status(404).json({ message: `Semana ${weekNumber} no encontrada en el planning` });
      }
      console.log('✅ Semana encontrada');

      // Encontrar el día específico
      const dayPlan = await DayPlan.findById(weekPlan.days.get(day));
      if (!dayPlan) {
        console.log('❌ Error: Día no encontrado');
        return res.status(404).json({ message: `Día ${day} no encontrado en la semana ${weekNumber}` });
      }
      console.log('✅ Día encontrado');

      // Crear la nueva sesión
      console.log('📝 Creando nueva sesión...', sessionDataMapped);
      const newSession = new Session({
        name: sessionDataMapped.name,
        tipo: sessionDataMapped.tipo,
        rondas: sessionDataMapped.rondas,
        exercises: [], // Inicialmente sin ejercicios
      });
      await newSession.save();
      console.log('✅ Sesión creada:', {
        id: newSession._id,
        nombre: newSession.name,
        tipo: newSession.tipo,
        rondas: newSession.rondas || 'No especificadas'
      });

      // Agregar la sesión al día
      dayPlan.sessions.push(newSession._id);
      await dayPlan.save();
      console.log('✅ Sesión agregada al día');

      // Obtener la sesión populada
      const populatedSession = await Session.findById(newSession._id)
        .populate({
          path: 'exercises',
          populate: {
            path: 'exercise',
            populate: {
              path: 'sets',
              populate: 'checkIns'
            }
          }
        });

      console.log('=== ✨ SESIÓN CREADA EXITOSAMENTE ===');
      res.status(201).json({
        message: 'Sesión creada exitosamente',
        data: {
          session: populatedSession,
          day: dayPlan
        }
      });

    } catch (error) {
      console.error("❌ createSession - Error:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({ 
        message: 'Error al crear la sesión', 
        error: error.message 
      });
    }
  };

  /**
   * Crear un nuevo ejercicio con sus sets para una sesión específica
   * @route POST /api/plannings/session/:sessionId/exercise
   */
  const createExercise = async (req, res) => {
    try {
      console.log('\n=== 🏋️ INICIANDO CREACIÓN DE EJERCICIO ===');
      const { sessionId } = req.params;
      const { exerciseId, name, sets } = req.body;
      console.log('📝 Datos recibidos:', { sessionId, exerciseId, name, sets });

      // Validar campos requeridos
      if (!sessionId || !exerciseId || !name || !sets || !Array.isArray(sets)) {
        console.log('❌ Error: Faltan campos requeridos');
        return res.status(400).json({
          message: 'Faltan campos requeridos. Se necesita sessionId, exerciseId, name y un array de sets'
        });
      }

      // Buscar la sesión y el ejercicio base
      const [session, baseExercise] = await Promise.all([
        Session.findById(sessionId),
        Exercise.findById(exerciseId)
      ]);

      if (!session) {
        console.log('❌ Error: Sesión no encontrada');
        return res.status(404).json({ message: 'Sesión no encontrada' });
      }
      if (!baseExercise) {
        console.log('❌ Error: Ejercicio base no encontrado');
        return res.status(404).json({ message: 'Ejercicio base no encontrado' });
      }
      console.log('✅ Sesión y ejercicio base encontrados');

      // Crear los sets
      console.log('📝 Creando sets...');
      const createdSets = [];
      for (const setData of sets) {
        const mappedSetData = mapSetFields(setData);
        const newSet = new Set(mappedSetData);
        await newSet.save();
        createdSets.push(newSet);
      }
      console.log(`✅ ${createdSets.length} sets creados`);

      // Crear el ejercicio de planning
      console.log('📝 Creando ejercicio de planning...');
      const newPlanningExercise = new PlanningExercise({
        exercise: exerciseId,
        name,
        sets: createdSets.map(set => set._id)
      });
      await newPlanningExercise.save();
      console.log('✅ Ejercicio de planning creado');

      // Agregar el ejercicio a la sesión
      session.exercises.push(newPlanningExercise._id);
      await session.save();
      console.log('✅ Ejercicio agregado a la sesión');

      // Poblar los datos del ejercicio para la respuesta
      const populatedExercise = await PlanningExercise.findById(newPlanningExercise._id)
        .populate('exercise')
        .populate('sets');

      return res.status(201).json({
        message: 'Ejercicio creado exitosamente',
        data: {
          exercise: populatedExercise,
          session: {
            id: session._id,
            name: session.name,
            exerciseCount: session.exercises.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Error al crear ejercicio:', error);
      return res.status(500).json({
        message: 'Error al crear el ejercicio',
        error: error.message
      });
    }
  };

  // Eliminar una sesión
  const deleteSession = async (req, res) => {
    try {
      console.log('\n====================================================================');
      console.log('================== 🚀 INICIO deleteSession ==========================');
      console.log('====================================================================\n');

      const { sessionId } = req.params;
      console.log('📝 Datos de la solicitud:');
      console.log('------------------------');
      console.log('ID de sesión:', sessionId);
      console.log('ID de usuario:', req.user.id);

      // Validar que el ID de sesión sea válido
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        console.log('❌ Error: ID de sesión inválido');
        console.log('ID proporcionado:', sessionId);
        return res.status(400).json({ message: 'ID de sesión inválido' });
      }

      // Buscar la sesión
      console.log('\n1️⃣ Buscando información de la sesión...');
      const session = await Session.findById(sessionId);
      if (!session) {
        console.log('❌ Error: Sesión no encontrada');
        console.log('ID buscado:', sessionId);
        return res.status(404).json({ message: 'Sesión no encontrada' });
      }
      console.log('✅ Sesión encontrada:', {
        id: session._id,
        nombre: session.name,
        numEjercicios: session.exercises.length,
        ejercicios: session.exercises
      });

      // Buscar el día que contiene esta sesión
      console.log('\n2️⃣ Buscando el día que contiene la sesión...');
      const dayPlan = await DayPlan.findOne({ sessions: sessionId });
      if (!dayPlan) {
        console.log('❌ Error: Día no encontrado');
        console.log('Buscando día con sesión ID:', sessionId);
        return res.status(404).json({ message: 'Día que contiene la sesión no encontrado' });
      }
      console.log('✅ Día encontrado:', {
        id: dayPlan._id,
        fecha: dayPlan.date,
        totalSesiones: dayPlan.sessions.length,
        sesiones: dayPlan.sessions
      });

      // Eliminar la referencia de la sesión del día
      console.log('\n3️⃣ Eliminando referencia de la sesión del día...');
      const sesionesAnteriores = dayPlan.sessions.length;
      dayPlan.sessions = dayPlan.sessions.filter(id => id.toString() !== sessionId);
      await dayPlan.save();
      console.log('✅ Referencia eliminada del día:', {
        sesionesPrevias: sesionesAnteriores,
        sesionesActuales: dayPlan.sessions.length,
        sesionesEliminadas: sesionesAnteriores - dayPlan.sessions.length
      });

      // Eliminar los ejercicios asociados a la sesión
      console.log('\n4️⃣ Iniciando eliminación de ejercicios y componentes...');
      let contadores = {
        ejercicios: 0,
        sets: 0,
        checkIns: 0
      };

      for (const exerciseId of session.exercises) {
        console.log(`\n📋 Procesando ejercicio ${exerciseId}...`);
        const exercise = await PlanningExercise.findById(exerciseId);
        if (exercise) {
          console.log('   Detalles del ejercicio:', {
            nombre: exercise.name,
            numSets: exercise.sets.length,
            sets: exercise.sets
          });
          
          // Eliminar los sets de cada ejercicio
          for (const setId of exercise.sets) {
            console.log(`   💪 Procesando set ${setId}...`);
            const set = await Set.findById(setId);
            if (set) {
              console.log('      Detalles del set:', {
                numCheckIns: set.checkIns.length,
                checkIns: set.checkIns
              });

              // Eliminar los checkIns de cada set
              for (const checkInId of set.checkIns) {
                const checkIn = await CheckIn.findByIdAndDelete(checkInId);
                contadores.checkIns++;
                console.log(`      ✓ CheckIn eliminado:`, {
                  id: checkInId,
                  datos: checkIn
                });
              }
              
              const setEliminado = await Set.findByIdAndDelete(setId);
              contadores.sets++;
              console.log(`   ✓ Set eliminado:`, {
                id: setId,
                datos: setEliminado
              });
            }
          }

          const ejercicioEliminado = await PlanningExercise.findByIdAndDelete(exerciseId);
          contadores.ejercicios++;
          console.log(`✓ Ejercicio eliminado:`, {
            id: exerciseId,
            datos: ejercicioEliminado
          });
        }
      }

      console.log('\n📊 Resumen de elementos eliminados:', {
        ejercicios: contadores.ejercicios,
        sets: contadores.sets,
        checkIns: contadores.checkIns,
        total: contadores.ejercicios + contadores.sets + contadores.checkIns
      });

      // Finalmente, eliminar la sesión
      console.log('\n5️⃣ Eliminando la sesión principal...');
      const sesionEliminada = await Session.findByIdAndDelete(sessionId);
      console.log('✅ Sesión eliminada exitosamente:', {
        id: sessionId,
        datos: sesionEliminada
      });

      console.log('\n====================================================================');
      console.log('================== ✨ FIN deleteSession ============================');
      console.log('====================================================================\n');

      res.status(200).json({
        message: 'Sesión y todos sus componentes eliminados exitosamente',
        data: {
          sessionId,
          dayId: dayPlan._id,
          elementosEliminados: contadores,
          detallesSesion: sesionEliminada
        }
      });

    } catch (error) {
      console.error("\n❌ ERROR EN DELETE SESSION ❌");
      console.error("Tipo de error:", error.name);
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);
      console.error("Detalles adicionales:", error);
      
      res.status(500).json({ 
        message: 'Error al eliminar la sesión', 
        error: {
          tipo: error.name,
          mensaje: error.message,
          detalles: error.toString()
        }
      });
    }
  };

  // Actualizar propiedades de un ejercicio en una sesión
  const updatePlanningExercise = async (req, res) => {
    try {
      const { planningId, weekNumber, day, sessionId, exerciseId } = req.params;
      const { sets } = req.body;

      console.log('Actualizando ejercicio:', { planningId, weekNumber, day, sessionId, exerciseId });
      console.log('Datos recibidos:', sets);

      // Validar que el planning existe
      const planning = await Planning.findById(planningId);
      if (!planning) {
        return res.status(404).json({ message: 'Planning no encontrado' });
      }

      // Obtener la semana específica del plan
      const week = planning.plan.find(w => w.weekNumber === parseInt(weekNumber));
      if (!week) {
        return res.status(404).json({ message: 'Semana no encontrada' });
      }

      // Obtener el día específico
      const dayPlan = await DayPlan.findById(week.days.get(day));
      if (!dayPlan) {
        return res.status(404).json({ message: 'Día no encontrado' });
      }

      // Verificar que la sesión existe y pertenece a este día
      const sessionExists = dayPlan.sessions.includes(sessionId);
      if (!sessionExists) {
        return res.status(404).json({ message: 'Sesión no encontrada en este día' });
      }

      // Obtener la sesión
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Sesión no encontrada' });
      }

      // Verificar que el ejercicio existe y pertenece a esta sesión
      const exerciseExists = session.exercises.includes(exerciseId);
      if (!exerciseExists) {
        return res.status(404).json({ message: 'Ejercicio no encontrado en esta sesión' });
      }

      // Encontrar el ejercicio
      const planningExercise = await PlanningExercise.findById(exerciseId);
      if (!planningExercise) {
        return res.status(404).json({ message: 'Ejercicio no encontrado' });
      }

      // Limpiar los sets existentes
      planningExercise.sets = [];

      // Crear los nuevos sets
      for (const setData of sets) {
        const setFields = {
          reps: setData.reps,
          weight: setData.weight,
          rest: setData.rest,
          tempo: setData.tempo,
          rpe: setData.rpe,
          rpm: setData.rpm,
          rir: setData.rir,
          speed: setData.speed,
          cadence: setData.cadence,
          distance: setData.distance,
          height: setData.height,
          calories: setData.calories,
          round: setData.round
        };

        const newSet = new Set(setFields);
        await newSet.save();
        planningExercise.sets.push(newSet._id);
      }

      // Guardar los cambios en el ejercicio
      await planningExercise.save();

      // Obtener el ejercicio actualizado con todos sus datos populados
      const updatedExercise = await PlanningExercise.findById(exerciseId)
        .populate('exercise')
        .populate({
          path: 'sets',
          populate: {
            path: 'checkIns'
          }
        });

      console.log('Ejercicio actualizado:', updatedExercise);
      res.status(200).json(updatedExercise);
    } catch (error) {
      console.error("updatePlanningExercise - Error:", error);
      res.status(500).json({ message: 'Error al actualizar el ejercicio', error: error.message });
    }
  };

  // Añadir ejercicio a una sesión específica
  const addExerciseToSession = async (req, res) => {
    console.log('=== INICIANDO ADICIÓN DE EJERCICIO A SESIÓN ===');
    console.log('1. Datos recibidos:', {
        planningId: req.params.planningId,
        weekNumber: req.params.weekNumber,
        day: req.params.day,
        sessionId: req.params.sessionId,
        exerciseData: req.body
    });

    try {
        // 1. Encontrar el planning
        const planning = await Planning.findOne({
            _id: req.params.planningId,
            trainer: req.user._id
        }).populate({
            path: 'plan',
            populate: {
                path: 'days',
                populate: {
                    path: 'sessions',
                    populate: 'exercises'
                }
            }
        });

        if (!planning) {
            console.log('2. Planning no encontrado');
            return res.status(404).json({
                status: 'error',
                message: 'Planning no encontrado'
            });
        }

        // 2. Encontrar la semana
        const week = planning.plan.find(w => w.weekNumber === parseInt(req.params.weekNumber));
        if (!week) {
            console.log('3. Semana no encontrada');
            return res.status(404).json({
                status: 'error',
                message: 'Semana no encontrada'
            });
        }

        // 3. Encontrar el día
        const dayPlan = week.days.get(req.params.day);
        if (!dayPlan) {
            console.log('4. Día no encontrado');
            return res.status(404).json({
                status: 'error',
                message: 'Día no encontrado'
            });
        }

        // 4. Encontrar la sesión
        const session = dayPlan.sessions.find(s => s._id.toString() === req.params.sessionId);
        if (!session) {
            console.log('5. Sesión no encontrada');
            return res.status(404).json({
                status: 'error',
                message: 'Sesión no encontrada'
            });
        }

        // 5. Crear el set inicial con todos los campos
        const initialSet = new Set({
            // Campos básicos
            reps: 12,
            weight: 20,
            rest: 23,
            
            // Campos adicionales
            tempo: "2-1-2-1",  // Ejemplo de tempo común
            rpe: 7,            // Valor medio de RPE
            rpm: 0,
            rir: 2,            // 2 repeticiones en reserva
            speed: 0,
            cadence: 0,
            distance: 0,
            height: 0,
            calories: 0,
            round: 1,          // Primera ronda por defecto

            // Configuración de renderizado por defecto
            renderConfig: {
                campo1: 'reps',
                campo2: 'weight',
                campo3: 'rest'
            }
        });
        await initialSet.save();

        // 6. Crear el ejercicio con referencia al set
        const planningExercise = new PlanningExercise({
            exercise: req.body.exerciseId,
            sets: [initialSet._id]
        });
        
        console.log('7. Creando nuevo ejercicio:', planningExercise);
        await planningExercise.save();

        // 7. Añadir el ejercicio a la sesión
        session.exercises.push(planningExercise._id);
        await session.save();

        // 8. Poblar el ejercicio para devolverlo en la respuesta
        await planningExercise.populate(['exercise', 'sets']);

        console.log('8. Ejercicio añadido exitosamente');
        res.status(200).json({
            status: 'success',
            data: planningExercise
        });

    } catch (error) {
        console.error('ERROR en addExerciseToSession:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al añadir el ejercicio a la sesión',
            error: error.message
        });
    }
  };

  // Actualizar la configuración de renderizado de un set
  const updateSetRenderConfig = async (req, res) => {
    console.log('=== INICIANDO ACTUALIZACIÓN DE RENDER CONFIG ===');
    try {
      const { planningId, weekNumber, day, sessionId, exerciseId, setId } = req.params;
      const { campo1, campo2, campo3 } = req.body;

      console.log('1. Parámetros recibidos:', {
        planningId,
        weekNumber,
        day,
        sessionId,
        exerciseId,
        setId,
        camposAActualizar: { campo1, campo2, campo3 }
      });

      // 1. Encontrar el planning
      const planning = await Planning.findOne({
        _id: planningId,
        trainer: req.user._id
      }).populate({
        path: 'plan',
        populate: {
          path: 'days',
          populate: {
            path: 'sessions',
            populate: {
              path: 'exercises',
              populate: 'sets'
            }
          }
        }
      });

      console.log('2. Planning encontrado:', planning ? 'Sí' : 'No');
      if (planning) {
        console.log('ID del trainer:', planning.trainer);
        console.log('Número de semanas:', planning.plan.length);
      }

      if (!planning) {
        return res.status(404).json({
          status: 'error',
          message: 'Planning no encontrado'
        });
      }

      // 2. Encontrar la semana
      const week = planning.plan.find(w => w.weekNumber === parseInt(weekNumber));
      console.log('3. Semana encontrada:', week ? 'Sí' : 'No');
      if (week) {
        console.log('Número de la semana:', week.weekNumber);
      }

      if (!week) {
        return res.status(404).json({
          status: 'error',
          message: 'Semana no encontrada'
        });
      }

      // 3. Encontrar el día
      const dayPlan = week.days.get(day);
      console.log('4. Día encontrado:', dayPlan ? 'Sí' : 'No');
      if (dayPlan) {
        console.log('Día de la semana:', day);
        console.log('Número de sesiones en el día:', dayPlan.sessions.length);
      }

      if (!dayPlan) {
        return res.status(404).json({
          status: 'error',
          message: 'Día no encontrado'
        });
      }

      // 4. Encontrar la sesión
      const session = dayPlan.sessions.find(s => s._id.toString() === sessionId);
      console.log('5. Sesión encontrada:', session ? 'Sí' : 'No');
      if (session) {
        console.log('ID de la sesión:', session._id);
        console.log('Nombre de la sesión:', session.name);
        console.log('Número de ejercicios en la sesión:', session.exercises.length);
      }

      if (!session) {
        return res.status(404).json({
          status: 'error',
          message: 'Sesión no encontrada'
        });
      }

      // 5. Encontrar el ejercicio
      const exercise = await PlanningExercise.findOne({
        _id: exerciseId,
        'sets': setId
      }).populate('sets');

      console.log('6. Ejercicio encontrado:', exercise ? 'Sí' : 'No');
      if (exercise) {
        console.log('ID del ejercicio:', exercise._id);
        console.log('Número de sets en el ejercicio:', exercise.sets.length);
      }

      if (!exercise) {
        return res.status(404).json({
          status: 'error',
          message: 'Ejercicio no encontrado'
        });
      }

      // 6. Encontrar el set
      const set = exercise.sets.find(s => s._id.toString() === setId);
      console.log('7. Set encontrado:', set ? 'Sí' : 'No');
      if (set) {
        console.log('ID del set:', set._id);
        console.log('Configuración actual del set:', set.renderConfig);
      }

      if (!set) {
        return res.status(404).json({
          status: 'error',
          message: 'Set no encontrado'
        });
      }

      // Validar que los campos son válidos
      const validFields = ['reps', 'weight', 'rest', 'tempo', 'rpe', 'rpm', 'rir', 'speed', 'cadence', 'distance', 'height', 'calories', 'round'];
      
      console.log('8. Validación de campos:');
      if (campo1) console.log('campo1:', campo1, 'válido:', validFields.includes(campo1));
      if (campo2) console.log('campo2:', campo2, 'válido:', validFields.includes(campo2));
      if (campo3) console.log('campo3:', campo3, 'válido:', validFields.includes(campo3));

      if (campo1 && !validFields.includes(campo1)) {
        return res.status(400).json({
          status: 'error',
          message: 'Campo1 no válido'
        });
      }
      if (campo2 && !validFields.includes(campo2)) {
        return res.status(400).json({
          status: 'error',
          message: 'Campo2 no válido'
        });
      }
      if (campo3 && !validFields.includes(campo3)) {
        return res.status(400).json({
          status: 'error',
          message: 'Campo3 no válido'
        });
      }

      // Actualizar solo los campos proporcionados
      console.log('9. Actualizando campos:');
      if (campo1) {
        console.log('Actualizando campo1:', campo1);
        set.renderConfig.campo1 = campo1;
      }
      if (campo2) {
        console.log('Actualizando campo2:', campo2);
        set.renderConfig.campo2 = campo2;
      }
      if (campo3) {
        console.log('Actualizando campo3:', campo3);
        set.renderConfig.campo3 = campo3;
      }

      await set.save();
      console.log('10. Set guardado con éxito');
      console.log('Nueva configuración:', set.renderConfig);

      res.status(200).json({
        status: 'success',
        data: {
          renderConfig: set.renderConfig
        }
      });

    } catch (error) {
      console.error('ERROR en updateSetRenderConfig:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error al actualizar la configuración de renderizado',
        error: error.message
      });
    }
  };

  // Función auxiliar para mapear los nombres de campos de set
  const mapSetFields = (setData) => {
    return {
      reps: setData.reps || setData.repeticiones,
      weight: setData.weight || setData.peso,
      rest: setData.rest || setData.descanso,
      tempo: setData.tempo || setData.ritmo,
      rpe: setData.rpe || setData.esfuerzoPercibido,
      rpm: setData.rpm || setData.revolucionesPorMinuto,
      rir: setData.rir || setData.repeticionesEnReserva,
      speed: setData.speed || setData.velocidad,
      cadence: setData.cadence || setData.cadencia,
      distance: setData.distance || setData.distancia,
      height: setData.height || setData.altura,
      calories: setData.calories || setData.calorias,
      round: setData.round || setData.ronda
    };
  };

  // Copiar una rutina a un día específico del planning
  const copyRoutineToDay = async (req, res) => {
    try {
      console.log('\n=== 🚀 INICIANDO COPIA DE RUTINA A DÍA ===');
      const { planningId, weekNumber, day } = req.params;
      const { routineData } = req.body;

      console.log('Datos recibidos:', {
        planningId,
        weekNumber,
        day,
        routineData: {
          exercises: routineData?.exercises?.length || 0
        }
      });

      // Validar datos requeridos
      if (!routineData || !routineData.exercises || !Array.isArray(routineData.exercises)) {
        return res.status(400).json({
          message: 'Se requiere un array de ejercicios en routineData.exercises'
        });
      }

      // Buscar el planning
      const planning = await Planning.findOne({
        _id: planningId,
        trainer: req.user._id
      }).populate({
        path: 'plan',
        match: { weekNumber: parseInt(weekNumber) }
      });

      if (!planning) {
        return res.status(404).json({
          message: 'Planning no encontrado o no pertenece al trainer'
        });
      }

      // Encontrar la semana específica
      const weekPlan = planning.plan.find(w => w.weekNumber === parseInt(weekNumber));
      if (!weekPlan) {
        return res.status(404).json({
          message: `Semana ${weekNumber} no encontrada en el planning`
        });
      }

      // Encontrar o crear el día
      let dayPlan = await DayPlan.findById(weekPlan.days.get(day));
      if (!dayPlan) {
        dayPlan = new DayPlan({
          day,
          fecha: new Date(), // Ajustar según necesidades
          sessions: []
        });
        await dayPlan.save();
        weekPlan.days.set(day, dayPlan._id);
        await weekPlan.save();
      }

      // Crear la sesión con los ejercicios
      const session = new Session({
        name: routineData.name || `Sesión ${dayPlan.sessions.length + 1}`,
        tipo: routineData.tipo || 'Normal',
        rondas: routineData.rondas || 1,
        exercises: []
      });

      // Procesar cada ejercicio
      for (const exerciseData of routineData.exercises) {
        const planningExercise = new PlanningExercise({
          exercise: exerciseData.exerciseId,
          sets: []
        });

        // Crear los sets para el ejercicio
        for (const setData of exerciseData.sets) {
          const set = new Set({
            reps: setData.reps,
            weight: setData.weight,
            rest: setData.rest,
            rpe: setData.rpe,
            rir: setData.rir,
            tempo: setData.tempo,
            completed: false
          });
          await set.save();
          planningExercise.sets.push(set._id);
        }

        await planningExercise.save();
        session.exercises.push(planningExercise._id);
      }

      await session.save();
      dayPlan.sessions.push(session._id);
      await dayPlan.save();

      // Obtener la sesión populada para la respuesta
      const populatedSession = await Session.findById(session._id)
        .populate({
          path: 'exercises',
          populate: [{
            path: 'exercise',
            select: 'nombre grupoMuscular descripcion equipo imgUrl'
          }, {
            path: 'sets'
          }]
        });

      console.log('=== ✨ RUTINA COPIADA EXITOSAMENTE ===');
      res.status(201).json({
        message: 'Rutina copiada exitosamente',
        data: {
          session: populatedSession,
          day: dayPlan
        }
      });

    } catch (error) {
      console.error("❌ copyRoutineToDay - Error:", error);
      res.status(500).json({
        message: 'Error al copiar la rutina',
        error: error.message
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
    addNextWeek,
    createSession,
    createExercise,
    deleteSession,
    updatePlanningExercise,
    addExerciseToSession,
    updateSetRenderConfig,
    copyRoutineToDay
  };