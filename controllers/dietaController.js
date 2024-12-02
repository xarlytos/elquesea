// controllers/dietaController.js
const mongoose = require('mongoose');
const Dieta = require('../models/Dieta');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer');

// Utilidad para crear los 7 días de una semana
const crearDias = (fechaInicio) => {
  console.log('crearDias - Fecha de inicio:', fechaInicio);
  const dias = [];

  for (let i = 0; i < 7; i++) {
    const fechaDia = new Date(fechaInicio);
    fechaDia.setDate(fechaInicio.getDate() + i);
    
    console.log(`crearDias - Creando día ${i + 1}:`, {
      fecha: fechaDia,
      diaSemana: fechaDia.toLocaleDateString('es-ES', { weekday: 'long' })
    });

    dias.push({
      fecha: fechaDia,
      restricciones: {
        calorias: 2000,
        proteinas: 150,
        carbohidratos: 250,
        grasas: 70,
      },
      comidas: []
    });
  }

  console.log('crearDias - Total días creados:', dias.length);
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
    console.log('\n=================================================================');
    console.log('================== INICIO getDietaById ===========================');
    console.log('=================================================================\n');

    console.log('📝 ID de dieta solicitada:', id);
    console.log('👤 ID del entrenador:', req.user.id);

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID de dieta inválido:', id);
      return res.status(400).json({ mensaje: 'ID de dieta inválido' });
    }

    console.log('🔍 Buscando dieta en la base de datos...');
    const dieta = await Dieta.findById(id)
      .populate('cliente', 'nombre email')
      .populate('trainer', 'nombre email especialidad')
      .exec();

    if (!dieta) {
      console.log('❌ Dieta no encontrada con ID:', id);
      return res.status(404).json({ mensaje: 'Dieta no encontrada' });
    }

    console.log('\n📋 Información general de la dieta:');
    console.log('----------------------------------');
    console.log('Nombre:', dieta.nombre);
    console.log('Cliente:', dieta.cliente.nombre);
    console.log('Email del cliente:', dieta.cliente.email);
    console.log('Entrenador:', dieta.trainer.nombre);
    console.log('Total de semanas:', dieta.semanas.length);

    // Verificar que el entrenador autenticado sea el creador de la dieta
    if (dieta.trainer._id.toString() !== req.user.id) {
      console.log('❌ Acceso no autorizado');
      console.log('ID del entrenador de la dieta:', dieta.trainer._id);
      console.log('ID del entrenador autenticado:', req.user.id);
      return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta dieta.' });
    }

    // Log detallado de la primera semana
    if (dieta.semanas && dieta.semanas.length > 0) {
      const primeraSemana = dieta.semanas[0];
      console.log('\n📅 Detalles de la primera semana:');
      console.log('----------------------------------');
      console.log('ID de la semana:', primeraSemana.idSemana);
      console.log('Fecha de inicio:', new Date(primeraSemana.fechaInicio).toLocaleDateString());
      console.log('\n📊 Días y sus restricciones:');
      console.log('----------------------------------');

      primeraSemana.dias.forEach((dia, index) => {
        const fechaDia = new Date(dia.fecha);
        console.log(`\n🗓️  Día ${index + 1} - ${fechaDia.toLocaleDateString('es-ES', { weekday: 'long' })} (${fechaDia.toLocaleDateString()})`);
        console.log('Restricciones:');
        console.log('  📌 Calorías:', dia.restricciones.calorias);
        console.log('  📌 Proteínas:', dia.restricciones.proteinas);
        console.log('  📌 Carbohidratos:', dia.restricciones.carbohidratos);
        console.log('  📌 Grasas:', dia.restricciones.grasas);
        console.log('  📝 Total de comidas:', dia.comidas.length);
      });
    } else {
      console.log('\n⚠️ La dieta no tiene semanas registradas');
    }

    console.log('\n=================================================================');
    console.log('================== FIN getDietaById ==============================');
    console.log('=================================================================\n');

    res.json(dieta);
  } catch (error) {
    console.error("\n❌ ERROR en getDietaById:");
    console.error("----------------------------------");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    console.error("----------------------------------\n");
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
  
// Crear una nueva semana en una dieta específica
const crearNuevaSemana = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('==================== crearNuevaSemana - INICIO ====================');
    console.log(`crearNuevaSemana - Creando nueva semana para dieta ID: ${id}`);

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`crearNuevaSemana - ID de dieta inválido: ${id}`);
      return res.status(400).json({ mensaje: 'ID de dieta inválido' });
    }

    // Buscar la dieta y verificar que pertenece al entrenador
    const dieta = await Dieta.findOne({ _id: id, trainer: req.user.id });
    if (!dieta) {
      console.log(`crearNuevaSemana - Dieta no encontrada o no autorizada`);
      return res.status(404).json({ mensaje: 'Dieta no encontrada o no autorizada' });
    }

    // Obtener la última semana
    const ultimaSemana = dieta.semanas[dieta.semanas.length - 1];
    if (!ultimaSemana) {
      console.log(`crearNuevaSemana - No se encontró la última semana`);
      return res.status(400).json({ mensaje: 'No hay semanas previas en la dieta' });
    }

    console.log('Última semana encontrada:', {
      idSemana: ultimaSemana.idSemana,
      fechaInicio: ultimaSemana.fechaInicio,
      totalDias: ultimaSemana.dias.length,
      ultimoDia: ultimaSemana.dias[ultimaSemana.dias.length - 1].fecha
    });

    // Obtener la última fecha de la semana anterior
    const ultimaFecha = new Date(ultimaSemana.dias[ultimaSemana.dias.length - 1].fecha);
    const fechaInicioNuevaSemana = new Date(ultimaFecha);
    fechaInicioNuevaSemana.setDate(ultimaFecha.getDate() + 1);

    console.log('Fechas calculadas:', {
      ultimaFecha: ultimaFecha.toISOString(),
      fechaInicioNuevaSemana: fechaInicioNuevaSemana.toISOString()
    });

    // Crear nueva semana con las mismas restricciones
    const nuevaSemana = {
      idSemana: ultimaSemana.idSemana + 1,
      fechaInicio: fechaInicioNuevaSemana,
      dias: crearDias(fechaInicioNuevaSemana)
    };

    console.log('Nueva semana creada:', {
      idSemana: nuevaSemana.idSemana,
      fechaInicio: nuevaSemana.fechaInicio,
      totalDias: nuevaSemana.dias.length,
      dias: nuevaSemana.dias.map(dia => ({
        fecha: dia.fecha,
        diaSemana: new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'long' })
      }))
    });

    // Agregar la nueva semana a la dieta
    dieta.semanas.push(nuevaSemana);
    await dieta.save();

    console.log('Dieta actualizada:', {
      nombre: dieta.nombre,
      totalSemanas: dieta.semanas.length,
      semanasIds: dieta.semanas.map(s => s.idSemana)
    });

    console.log('==================== crearNuevaSemana - FIN ====================');

    res.status(201).json({
      semana: nuevaSemana,
      totalSemanas: dieta.semanas.length,
      mensaje: `Semana ${nuevaSemana.idSemana} creada exitosamente. Total de semanas: ${dieta.semanas.length}`,
      resumenDias: nuevaSemana.dias.map(dia => ({
        fecha: dia.fecha,
        diaSemana: new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'long' })
      }))
    });
  } catch (error) {
    console.error("crearNuevaSemana - Error:", error);
    res.status(500).json({ mensaje: 'Error al crear nueva semana', error });
  }
};

// Actualizar macros de un día específico
const actualizarMacrosDia = async (req, res) => {
  try {
    console.log('\n=================================================================');
    console.log('================== INICIO actualizarMacrosDia ====================');
    console.log('=================================================================\n');

    const { id, fecha } = req.params;
    const { calorias, proteinas, carbohidratos, grasas } = req.body;

    console.log('📝 Parámetros recibidos:');
    console.log('------------------------');
    console.log('ID de la dieta:', id);
    console.log('Fecha solicitada:', fecha);
    console.log('Macros a actualizar:', {
      calorias,
      proteinas,
      carbohidratos,
      grasas
    });
    console.log('ID del entrenador:', req.user.id);
    console.log('\n');

    // Validar ID
    console.log('🔍 Validando ID de la dieta...');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID de dieta inválido:', id);
      return res.status(400).json({ mensaje: 'ID de dieta inválido' });
    }
    console.log('✅ ID de dieta válido\n');

    // Validar que los macros sean números positivos
    console.log('🔍 Validando valores de macros...');
    const macros = { calorias, proteinas, carbohidratos, grasas };
    for (const [key, value] of Object.entries(macros)) {
      console.log(`Validando ${key}:`, value);
      if (typeof value !== 'number' || value < 0) {
        console.log(`❌ Valor inválido para ${key}:`, value);
        return res.status(400).json({ 
          mensaje: 'Los valores de macros deben ser números positivos',
          error: `Valor inválido para ${key}: ${value}`
        });
      }
    }
    console.log('✅ Todos los macros son válidos\n');

    // Buscar la dieta
    console.log('🔍 Buscando dieta en la base de datos...');
    const dieta = await Dieta.findOne({ _id: id, trainer: req.user.id });
    
    if (!dieta) {
      console.log('❌ Dieta no encontrada o no autorizada');
      console.log('ID de dieta buscada:', id);
      console.log('ID de entrenador:', req.user.id);
      return res.status(404).json({ mensaje: 'Dieta no encontrada o no autorizada' });
    }
    console.log('✅ Dieta encontrada');
    console.log('Nombre de la dieta:', dieta.nombre);
    console.log('Total de semanas:', dieta.semanas.length);
    console.log('\n');

    // Buscar el día específico
    console.log('🔍 Buscando el día específico...');
    let diaEncontrado = false;
    const fechaBuscada = new Date(fecha);
    fechaBuscada.setHours(0, 0, 0, 0);

    console.log('Fecha a buscar:', fechaBuscada.toISOString());
    console.log('Buscando en', dieta.semanas.length, 'semanas...\n');

    for (const semana of dieta.semanas) {
      console.log(`📅 Revisando semana ${semana.idSemana}:`);
      console.log('Fecha inicio de semana:', new Date(semana.fechaInicio).toISOString());
      console.log('Total días en la semana:', semana.dias.length);

      const diaIndex = semana.dias.findIndex(dia => {
        const diaFecha = new Date(dia.fecha);
        diaFecha.setHours(0, 0, 0, 0);
        const coincide = diaFecha.getTime() === fechaBuscada.getTime();
        if (coincide) {
          console.log('🎯 Día encontrado!');
          console.log('Macros actuales:', dia.restricciones);
        }
        return coincide;
      });

      if (diaIndex !== -1) {
        console.log(`✅ Día encontrado en semana ${semana.idSemana}, índice ${diaIndex}`);
        
        // Guardar macros anteriores para el log
        const macrosAnteriores = { ...semana.dias[diaIndex].restricciones };
        
        // Actualizar los macros del día
        semana.dias[diaIndex].restricciones = {
          calorias,
          proteinas,
          carbohidratos,
          grasas
        };

        console.log('\n📊 Comparación de macros:');
        console.log('------------------------');
        console.log('Anteriores:', macrosAnteriores);
        console.log('Nuevos:', semana.dias[diaIndex].restricciones);

        diaEncontrado = true;
        break;
      }
    }

    if (!diaEncontrado) {
      console.log(`❌ No se encontró el día con fecha ${fecha}`);
      return res.status(404).json({ mensaje: 'Día no encontrado en la dieta' });
    }

    // Guardar los cambios
    console.log('\n💾 Guardando cambios en la base de datos...');
    await dieta.save();
    console.log('✅ Cambios guardados exitosamente');

    console.log('\n=================================================================');
    console.log('================== FIN actualizarMacrosDia =======================');
    console.log('=================================================================\n');

    res.status(200).json({
      mensaje: 'Macros actualizados exitosamente',
      fecha: fechaBuscada,
      macrosActualizados: {
        calorias,
        proteinas,
        carbohidratos,
        grasas
      }
    });
  } catch (error) {
    console.error("\n❌ ERROR en actualizarMacrosDia:");
    console.error("----------------------------------");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    console.error("----------------------------------\n");
    
    res.status(500).json({ 
      mensaje: 'Error al actualizar los macros',
      error: error.message 
    });
  }
};

// Crear una nueva comida para un día específico
const crearComida = async (req, res) => {
  try {
    console.log('📝 Datos recibidos:', req.body);
    const { id, fecha } = req.params;
    let {
      // Campos en español
      numero, peso, calorias, proteinas, carbohidratos, grasas,
      // Campos en inglés
      number, weight, calories, protein, proteins, carbs, fats,
      // Campos adicionales
      name, nombre, time, hora
    } = req.body;

    // Normalizar valores usando ambos idiomas
    numero = numero || number || 1;
    peso = peso || weight || 100;
    const nombreComida = nombre || name || 'Sin nombre';
    const horaComida = hora || time || '12:00';

    // Convertir valores a números
    numero = parseInt(numero);
    peso = parseFloat(peso);

    // Usar valores en inglés si los españoles no están presentes
    calorias = parseFloat(calorias) || parseFloat(calories) || 0;
    proteinas = parseFloat(proteinas) || parseFloat(protein) || parseFloat(proteins) || 0;
    carbohidratos = parseFloat(carbohidratos) || parseFloat(carbs) || 0;
    grasas = parseFloat(grasas) || parseFloat(fats) || 0;

    // Validar que los valores numéricos sean válidos
    if (isNaN(numero) || isNaN(peso) || 
        isNaN(calorias) || isNaN(proteinas) || 
        isNaN(carbohidratos) || isNaN(grasas)) {
      console.log('❌ Error: Valores numéricos inválidos en los datos recibidos');
      return res.status(400).json({ 
        msg: 'Error: Algunos valores numéricos son inválidos',
        datosRecibidos: req.body 
      });
    }

    // Buscar la dieta
    const dieta = await Dieta.findById(id);
    if (!dieta) {
      console.log('❌ Dieta no encontrada:', id);
      return res.status(404).json({ msg: 'Dieta no encontrada' });
    }

    // Convertir la fecha recibida a objeto Date
    const fechaBuscada = new Date(fecha);
    fechaBuscada.setHours(0, 0, 0, 0);

    // Buscar la semana y el día correspondiente
    let diaEncontrado = null;
    let semanaEncontrada = null;

    for (const semana of dieta.semanas) {
      const dia = semana.dias.find(d => {
        const diaFecha = new Date(d.fecha);
        diaFecha.setHours(0, 0, 0, 0);
        return diaFecha.getTime() === fechaBuscada.getTime();
      });

      if (dia) {
        diaEncontrado = dia;
        semanaEncontrada = semana;
        break;
      }
    }

    if (!diaEncontrado) {
      console.log('❌ Día no encontrado:', fecha);
      return res.status(404).json({ msg: 'Día no encontrado en la dieta' });
    }

    // Crear la nueva comida
    const nuevaComida = {
      numero,
      peso,
      ingredientes: [{
        nombre: nombreComida,
        calorias,
        proteinas,
        carbohidratos,
        grasas
      }]
    };

    // Agregar la comida al día
    diaEncontrado.comidas.push(nuevaComida);

    // Calcular totales del día
    const totalesDia = diaEncontrado.comidas.reduce((acc, comida) => {
      const totalesComida = comida.ingredientes.reduce((accIng, ing) => ({
        calorias: accIng.calorias + ing.calorias,
        proteinas: accIng.proteinas + ing.proteinas,
        carbohidratos: accIng.carbohidratos + ing.carbohidratos,
        grasas: accIng.grasas + ing.grasas
      }), { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });

      return {
        calorias: acc.calorias + totalesComida.calorias,
        proteinas: acc.proteinas + totalesComida.proteinas,
        carbohidratos: acc.carbohidratos + totalesComida.carbohidratos,
        grasas: acc.grasas + totalesComida.grasas
      };
    }, { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });

    await dieta.save();
    console.log('✅ Comida creada exitosamente:', nuevaComida);
    
    res.json({ 
      msg: 'Comida creada exitosamente',
      comida: nuevaComida,
      totalesDia
    });

  } catch (error) {
    console.error('❌ Error al crear comida:', error);
    res.status(500).json({ msg: 'Error al crear la comida', error: error.message });
  }
};

// Actualizar una comida existente
const actualizarComida = async (req, res) => {
  try {
    console.log('\n=================================================================');
    console.log('================== INICIO actualizarComida =======================');
    console.log('=================================================================\n');

    const { id, fecha, comidaId } = req.params;
    const datosActualizados = req.body;

    console.log('📝 Datos recibidos:');
    console.log('------------------');
    console.log('ID Dieta:', id);
    console.log('Fecha:', fecha);
    console.log('ID Comida:', comidaId);
    console.log('Datos actualizados:', datosActualizados);

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID de dieta inválido');
      return res.status(400).json({ mensaje: 'ID de dieta inválido' });
    }

    // Buscar la dieta
    console.log('🔍 Buscando dieta...');
    const dieta = await Dieta.findOne({ _id: id, trainer: req.user.id });
    if (!dieta) {
      console.log('❌ Dieta no encontrada o no autorizada');
      return res.status(404).json({ mensaje: 'Dieta no encontrada o no autorizada' });
    }

    // Buscar el día y la comida
    console.log('🔍 Buscando día y comida específicos...');
    const fechaBuscada = new Date(fecha);
    fechaBuscada.setHours(0, 0, 0, 0);
    let encontrado = false;

    for (const semana of dieta.semanas) {
      const diaIndex = semana.dias.findIndex(dia => {
        const diaFecha = new Date(dia.fecha);
        diaFecha.setHours(0, 0, 0, 0);
        return diaFecha.getTime() === fechaBuscada.getTime();
      });

      if (diaIndex !== -1) {
        const comidaIndex = semana.dias[diaIndex].comidas.findIndex(
          comida => comida._id.toString() === comidaId
        );

        if (comidaIndex !== -1) {
          console.log('✅ Comida encontrada, actualizando...');
          semana.dias[diaIndex].comidas[comidaIndex] = {
            ...semana.dias[diaIndex].comidas[comidaIndex],
            ...datosActualizados
          };
          encontrado = true;
          break;
        }
      }
    }

    if (!encontrado) {
      console.log('❌ Comida no encontrada');
      return res.status(404).json({ mensaje: 'Comida no encontrada' });
    }

    // Guardar cambios
    console.log('💾 Guardando cambios...');
    await dieta.save();

    console.log('✅ Comida actualizada exitosamente');
    console.log('\n=================================================================');
    console.log('================== FIN actualizarComida =========================');
    console.log('=================================================================\n');

    res.json({
      mensaje: 'Comida actualizada exitosamente',
      comida: datosActualizados
    });
  } catch (error) {
    console.error('❌ Error en actualizarComida:', error);
    res.status(500).json({ mensaje: 'Error al actualizar la comida', error: error.message });
  }
};

// Crear una nueva comida en un día específico
exports.crearComida = async (req, res) => {
  try {
    console.log('Creando nueva comida - Datos recibidos:', req.body);
    const { id, fecha } = req.params;
    const { numero, peso, ingredientes } = req.body;

    // Buscar la dieta
    const dieta = await Dieta.findById(id);
    if (!dieta) {
      console.log('Dieta no encontrada:', id);
      return res.status(404).json({ msg: 'Dieta no encontrada' });
    }

    // Encontrar el día específico
    const dia = dieta.dias.find(d => d.fecha.toISOString().split('T')[0] === fecha);
    if (!dia) {
      console.log('Día no encontrado:', fecha);
      return res.status(404).json({ msg: 'Día no encontrado en la dieta' });
    }

    // Crear la nueva comida
    const nuevaComida = {
      numero,
      peso,
      ingredientes: ingredientes.map(ing => ({
        nombre: ing.nombre,
        calorias: ing.calorias,
        proteinas: ing.proteinas,
        carbohidratos: ing.carbohidratos,
        grasas: ing.grasas
      }))
    };

    // Calcular totales de la comida
    const totales = ingredientes.reduce((acc, ing) => ({
      calorias: acc.calorias + ing.calorias,
      proteinas: acc.proteinas + ing.proteinas,
      carbohidratos: acc.carbohidratos + ing.carbohidratos,
      grasas: acc.grasas + ing.grasas
    }), { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });

    nuevaComida.totales = totales;

    // Agregar la comida al día
    dia.comidas.push(nuevaComida);

    // Actualizar los totales del día
    dia.totales = dia.comidas.reduce((acc, comida) => ({
      calorias: acc.calorias + comida.totales.calorias,
      proteinas: acc.proteinas + comida.totales.proteinas,
      carbohidratos: acc.carbohidratos + comida.totales.carbohidratos,
      grasas: acc.grasas + comida.totales.grasas
    }), { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });

    await dieta.save();
    console.log('Comida creada exitosamente');
    
    res.json({ 
      msg: 'Comida creada exitosamente',
      comida: nuevaComida,
      totalesDia: dia.totales
    });

  } catch (error) {
    console.error('Error al crear comida:', error);
    res.status(500).json({ msg: 'Error al crear la comida', error: error.message });
  }
};

// Actualizar una comida existente
exports.actualizarComida = async (req, res) => {
  try {
    console.log('Actualizando comida - Datos recibidos:', req.body);
    const { id, fecha, comidaId } = req.params;
    const actualizaciones = req.body;

    // Buscar la dieta
    const dieta = await Dieta.findById(id);
    if (!dieta) {
      console.log('Dieta no encontrada:', id);
      return res.status(404).json({ msg: 'Dieta no encontrada' });
    }

    // Encontrar el día específico
    const dia = dieta.dias.find(d => d.fecha.toISOString().split('T')[0] === fecha);
    if (!dia) {
      console.log('Día no encontrado:', fecha);
      return res.status(404).json({ msg: 'Día no encontrado en la dieta' });
    }

    // Encontrar la comida específica
    const comida = dia.comidas.id(comidaId);
    if (!comida) {
      console.log('Comida no encontrada:', comidaId);
      return res.status(404).json({ msg: 'Comida no encontrada' });
    }

    // Actualizar los campos de la comida
    if (actualizaciones.numero) comida.numero = actualizaciones.numero;
    if (actualizaciones.peso) comida.peso = actualizaciones.peso;
    if (actualizaciones.ingredientes) {
      comida.ingredientes = actualizaciones.ingredientes.map(ing => ({
        nombre: ing.nombre,
        calorias: ing.calorias,
        proteinas: ing.proteinas,
        carbohidratos: ing.carbohidratos,
        grasas: ing.grasas
      }));

      // Recalcular totales de la comida
      comida.totales = comida.ingredientes.reduce((acc, ing) => ({
        calorias: acc.calorias + ing.calorias,
        proteinas: acc.proteinas + ing.proteinas,
        carbohidratos: acc.carbohidratos + ing.carbohidratos,
        grasas: acc.grasas + ing.grasas
      }), { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });
    }

    // Recalcular los totales del día
    dia.totales = dia.comidas.reduce((acc, comida) => ({
      calorias: acc.calorias + comida.totales.calorias,
      proteinas: acc.proteinas + comida.totales.proteinas,
      carbohidratos: acc.carbohidratos + comida.totales.carbohidratos,
      grasas: acc.grasas + comida.totales.grasas
    }), { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });

    await dieta.save();
    console.log('Comida actualizada exitosamente');

    res.json({ 
      msg: 'Comida actualizada exitosamente',
      comida: comida,
      totalesDia: dia.totales
    });

  } catch (error) {
    console.error('Error al actualizar comida:', error);
    res.status(500).json({ msg: 'Error al actualizar la comida', error: error.message });
  }
};

module.exports = {
  getAllDietas,
  getDietaById,
  crearDieta,
  actualizarDieta,
  eliminarDieta,
  getDietasByTrainer,
  crearNuevaSemana,
  actualizarMacrosDia,
  crearComida,
  actualizarComida
};
