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
      res.status(500).json({ message: 'Error al obtener el planning', error });
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
        esqueleto: {
          periodos: []
        },
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
        .populate({
          path: 'sets',
          populate: {
            path: 'checkIns'
          }
        });

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

  // Inicializar esqueleto en una planificación existente
  const initializeEsqueleto = async (req, res) => {
    try {
      console.log('=== Inicializando Esqueleto ===');
      console.log('ID del Planning:', req.params.planningId);
      
      const planning = await Planning.findByIdAndUpdate(
        req.params.planningId,
        { 
          $set: { 
            esqueleto: {
              periodos: []
            }
          }
        },
        { new: true }
      );
      
      if (!planning) {
        console.log('Error: Planning no encontrado');
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
      
      console.log('Esqueleto inicializado:', planning.esqueleto);
      res.status(200).json(planning);
    } catch (error) {
      console.error('Error en initializeEsqueleto:', error);
      res.status(500).json({ message: error.message });
    }
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
        match: { weekNumber: weekNumber }
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

  // Asignar un esqueleto a un planning
  const assignEsqueletoToPlanning = async (req, res) => {
    try {
      console.log('\n=== 🔄 INICIANDO ASIGNACIÓN DE ESQUELETO A PLANNING ===');
      
      // Logging de todos los datos recibidos
      console.log('📝 Datos de la petición:');
      console.log('- Parámetros:', req.params);
      console.log('- Body:', req.body);
      console.log('- Usuario:', {
        id: req.user.id,
        role: req.user.role
      });

      const { planningId } = req.params;
      const { esqueletoId } = req.body;

      console.log('\n🔍 IDs a procesar:');
      console.log('- Planning ID:', planningId);
      console.log('- Esqueleto ID:', esqueletoId);

      // Validar que los IDs sean válidos
      if (!mongoose.Types.ObjectId.isValid(planningId) || !mongoose.Types.ObjectId.isValid(esqueletoId)) {
        console.log('❌ Error: IDs inválidos');
        return res.status(400).json({ message: 'IDs inválidos' });
      }
      console.log('✅ IDs validados correctamente');

      // Buscar el planning y verificar que pertenece al trainer
      console.log('\n🔍 Buscando planning...');
      const planning = await Planning.findOne({
        _id: planningId,
        trainer: req.user.id
      });

      if (!planning) {
        console.log('❌ Error: Planning no encontrado o no pertenece al trainer');
        return res.status(404).json({ message: 'Planning no encontrado o no tienes permisos para modificarlo' });
      }
      console.log('✅ Planning encontrado:', {
        id: planning._id,
        nombre: planning.nombre,
        trainer: planning.trainer
      });

      // Buscar el esqueleto
      console.log('\n🔍 Buscando esqueleto...');
      const esqueleto = await mongoose.model('Esqueleto').findById(esqueletoId);
      if (!esqueleto) {
        console.log('❌ Error: Esqueleto no encontrado');
        return res.status(404).json({ message: 'Esqueleto no encontrado' });
      }
      console.log('✅ Esqueleto encontrado:', {
        id: esqueleto._id,
        nombre: esqueleto.nombre,
        planningsActuales: esqueleto.plannings.length
      });

      // Asignar el esqueleto al planning
      console.log('\n📝 Asignando esqueleto al planning...');
      planning.esqueleto = esqueletoId;
      await planning.save();
      console.log('✅ Esqueleto asignado al planning');

      // Agregar el planning al array de plannings del esqueleto
      console.log('\n📝 Actualizando array de plannings en el esqueleto...');
      if (!esqueleto.plannings.includes(planningId)) {
        esqueleto.plannings.push(planningId);
        await esqueleto.save();
        console.log('✅ Planning añadido al array de plannings del esqueleto');
      } else {
        console.log('ℹ️ El planning ya estaba en el array del esqueleto');
      }

      // Devolver el planning actualizado con el esqueleto populado
      console.log('\n🔄 Obteniendo planning actualizado con datos populados...');
      const updatedPlanning = await Planning.findById(planningId)
        .populate('esqueleto')
        .populate('cliente', 'nombre email')
        .populate('trainer', 'nombre email especialidad');

      console.log('✅ Proceso completado exitosamente');
      console.log('=== 🎉 FIN DE LA ASIGNACIÓN ===\n');

      res.status(200).json({
        message: 'Esqueleto asignado correctamente',
        planning: updatedPlanning
      });

    } catch (error) {
      console.error("\n❌ Error en assignEsqueletoToPlanning:");
      console.error("- Mensaje:", error.message);
      console.error("- Stack:", error.stack);
      res.status(500).json({ 
        message: 'Error al asignar el esqueleto al planning', 
        error: error.message 
      });
    }
  };

  // Controlador para variante
  const createVariante = async (req, res) => {
    try {
      console.log('=== Creando/Actualizando Variante ===');
      console.log('ID del Planning:', req.params.planningId);
      console.log('Datos recibidos:', req.body);
      
      const { tipo1, numeroVariantePrimeraSerie, tipo2, numeroVariantePosteriorSerie } = req.body;
      const variante = {
        tipo1,
        numeroVariantePrimeraSerie,
        tipo2,
        numeroVariantePosteriorSerie
      };
      
      console.log('Objeto variante a guardar:', variante);
      
      const planning = await Planning.findByIdAndUpdate(
        req.params.planningId,
        { $set: { variante } },
        { new: true }
      );
      
      console.log('Planning actualizado:', planning ? 'Éxito' : 'No encontrado');
      
      if (!planning) {
        console.log('Error: Planning no encontrado');
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
      
      console.log('Variante guardada exitosamente');
      res.status(200).json(planning);
    } catch (error) {
      console.error('Error en createVariante:', error);
      res.status(500).json({ message: error.message });
    }
  };

  // Controlador para ejercicioEsqueleto
  const createEjercicioEsqueleto = async (req, res) => {
    try {
      console.log('=== Creando Ejercicio Esqueleto ===');
      console.log('ID del Planning:', req.params.planningId);
      console.log('Datos recibidos:', req.body);
      
      const { nombre, series, ejercicios } = req.body;
      const ejercicioEsqueleto = {
        nombre,
        series,
        ejercicios
      };
      
      console.log('Objeto ejercicioEsqueleto a guardar:', ejercicioEsqueleto);
      
      const planning = await Planning.findByIdAndUpdate(
        req.params.planningId,
        { $push: { ejerciciosEsqueleto: ejercicioEsqueleto } },
        { new: true }
      );
      
      console.log('Planning actualizado:', planning ? 'Éxito' : 'No encontrado');
      
      if (!planning) {
        console.log('Error: Planning no encontrado');
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
      
      console.log('Ejercicio Esqueleto añadido exitosamente');
      res.status(200).json(planning);
    } catch (error) {
      console.error('Error en createEjercicioEsqueleto:', error);
      res.status(500).json({ message: error.message });
    }
  };

  // Controlador para periodo
  const createPeriodo = async (req, res) => {
    try {
      console.log('=== Creando Periodos ===');
      console.log('ID del Planning:', req.params.planningId);
      console.log('Datos recibidos:', req.body);
      
      const planning = await Planning.findById(req.params.planningId);
      
      if (!planning) {
        console.log('Error: Planning no encontrado');
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
      
      // Si no tiene esqueleto, lo inicializamos
      if (!planning.esqueleto) {
        console.log('Inicializando esqueleto automáticamente');
        planning.esqueleto = {
          periodos: []
        };
      }

      // Verificar si es un solo periodo o un array de periodos
      const periodos = Array.isArray(req.body) ? req.body : [req.body];
      
      // Validar y procesar cada periodo
      for (const periodoData of periodos) {
        const { inicioSemana, finSemana, inicioDia, finDia, nombre } = periodoData;
        
        // Validar que todos los campos requeridos estén presentes
        if (!inicioSemana || !finSemana || !inicioDia || !finDia || !nombre) {
          throw new Error('Los campos inicioSemana, finSemana, inicioDia, finDia y nombre son requeridos para cada periodo');
        }

        const periodo = {
          nombre,
          inicioSemana,
          finSemana,
          inicioDia,
          finDia,
          ejercicios: [] // Inicializamos con un array vacío de ejercicios
        };

        console.log('Añadiendo periodo:', periodo);
        planning.esqueleto.periodos.push(periodo);
      }

      await planning.save();
      
      console.log(`${periodos.length} periodo(s) añadido(s) exitosamente`);
      res.status(200).json({
        message: `${periodos.length} periodo(s) añadido(s) exitosamente`,
        planning
      });
    } catch (error) {
      console.error('Error en createPeriodo:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ message: error.message });
    }
  };

  // Obtener periodos de un planning
  const getPeriodos = async (req, res) => {
    try {
      console.log('=== Obteniendo Periodos ===');
      console.log('ID del Planning:', req.params.planningId);
      
      const planning = await Planning.findById(req.params.planningId);
      
      if (!planning) {
        console.log('Error: Planning no encontrado');
        return res.status(404).json({ message: 'Planning no encontrado' });
      }
      
      if (!planning.esqueleto || !planning.esqueleto.periodos) {
        console.log('No hay periodos definidos en este planning');
        return res.status(200).json({
          planningId: planning._id,
          periodos: [],
          totalPeriodos: 0
        });
      }
      
      console.log('Periodos encontrados:', planning.esqueleto.periodos);
      res.status(200).json({
        planningId: planning._id,
        periodos: planning.esqueleto.periodos,
        totalPeriodos: planning.esqueleto.periodos.length
      });
    } catch (error) {
      console.error('Error en getPeriodos:', error);
      res.status(500).json({ message: error.message });
    }
  };

  // Crear esqueleto para un planning
  const createEsqueleto = async (req, res) => {
    try {
      const { id } = req.params;
      const periodos = req.body;

      console.log('=== Creando Esqueleto ===');
      console.log('ID del Planning:', id);
      console.log('Periodos recibidos:', periodos);

      // Validar que el planning existe
      const planning = await Planning.findById(id);
      if (!planning) {
        return res.status(404).json({ mensaje: 'Planning no encontrado' });
      }

      // Validar el formato de los periodos
      if (!Array.isArray(periodos)) {
        return res.status(400).json({ mensaje: 'Los periodos deben ser un array' });
      }

      // Validar cada periodo
      for (const periodo of periodos) {
        if (!periodo.nombre || !periodo.inicioSemana || !periodo.finSemana || 
            !periodo.inicioDia || !periodo.finDia) {
          return res.status(400).json({ 
            mensaje: 'Cada periodo debe tener nombre, inicioSemana, finSemana, inicioDia y finDia' 
          });
        }
      }

      // Crear el objeto esqueleto con el array de periodos
      planning.esqueleto = {
        periodos: periodos.map(periodo => ({
          nombre: periodo.nombre,
          inicioSemana: periodo.inicioSemana,
          finSemana: periodo.finSemana,
          inicioDia: periodo.inicioDia,
          finDia: periodo.finDia,
          ejercicios: []
        }))
      };

      console.log('Esqueleto a guardar:', planning.esqueleto);

      await planning.save();

      res.status(200).json({ 
        mensaje: 'Esqueleto creado exitosamente',
        esqueleto: planning.esqueleto 
      });

    } catch (error) {
      console.error('Error al crear esqueleto:', error);
      res.status(500).json({ 
        mensaje: 'Error al crear el esqueleto', 
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
    initializeEsqueleto,
    copyRoutineToDay,
    assignEsqueletoToPlanning,
    createVariante,
    createEjercicioEsqueleto,
    createPeriodo,
    getPeriodos,
    createEsqueleto
  };