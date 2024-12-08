const Event = require('../models/Event');
const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Crear un evento
exports.createEvent = catchAsync(async (req, res, next) => {
  console.log('⭐ Iniciando creación de nuevo evento');
  console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));

  const {
    title,
    description,
    startDate,
    endDate,
    type,
    origin,
    isWorkRelated,
    trainer,
    client,
    relatedService,
    relatedPaymentPlan,
    relatedRoutinePlan,
    alerts
  } = req.body;

  // Validar que la fecha de inicio sea anterior a la fecha de fin
  if (new Date(startDate) >= new Date(endDate)) {
    console.log('❌ Error: Fecha de inicio posterior o igual a fecha de fin');
    return next(new AppError('La fecha de inicio debe ser anterior a la fecha de fin', 400));
  }

  // Validar referencias si existen
  if (client) {
    console.log(`🔍 Verificando cliente ID: ${client}`);
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      console.log('❌ Error: Cliente no encontrado');
      return next(new AppError('Cliente no encontrado', 404));
    }
    console.log('✅ Cliente verificado');
  }

  const newEvent = await Event.create({
    title,
    description,
    startDate,
    endDate,
    type,
    origin,
    isWorkRelated,
    trainer,
    client,
    relatedService,
    relatedPaymentPlan,
    relatedRoutinePlan,
    alerts
  });

  console.log(`✅ Evento creado con éxito. ID: ${newEvent._id}`);

  const populatedEvent = await Event.findById(newEvent._id)
    .populate('trainer', 'name email')
    .populate('client', 'name email')
    .populate('relatedService')
    .populate('relatedPaymentPlan')
    .populate('relatedRoutinePlan');

  console.log('📤 Enviando respuesta con evento populado');
  res.status(201).json({
    status: 'success',
    data: {
      event: populatedEvent
    }
  });
});

// Obtener todos los eventos
exports.getAllEvents = catchAsync(async (req, res) => {
  console.log('⭐ Obteniendo lista de eventos');
  console.log('🔍 Filtros aplicados:', JSON.stringify(req.query, null, 2));

  const query = { ...req.query };
  
  // Filtrado básico
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete query[field]);

  // Filtrado por fecha
  if (query.startDate) {
    console.log(`📅 Filtrando eventos desde: ${query.startDate}`);
    query.startDate = { $gte: new Date(query.startDate) };
  }
  if (query.endDate) {
    console.log(`📅 Filtrando eventos hasta: ${query.endDate}`);
    query.endDate = { $lte: new Date(query.endDate) };
  }

  const events = await Event.find(query)
    .populate('trainer', 'name email')
    .populate('client', 'name email')
    .populate('relatedService')
    .populate('relatedPaymentPlan')
    .populate('relatedRoutinePlan')
    .sort({ startDate: 1 });

  console.log(`✅ Encontrados ${events.length} eventos`);
  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});

// Obtener un evento por ID
exports.getEventById = catchAsync(async (req, res, next) => {
  console.log(`⭐ Buscando evento con ID: ${req.params.id}`);

  const event = await Event.findById(req.params.id)
    .populate('trainer', 'name email')
    .populate('client', 'name email')
    .populate('relatedService')
    .populate('relatedPaymentPlan')
    .populate('relatedRoutinePlan');

  if (!event) {
    console.log('❌ Evento no encontrado');
    return next(new AppError('No se encontró el evento con ese ID', 404));
  }

  console.log('✅ Evento encontrado');
  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

// Actualizar un evento
exports.updateEvent = catchAsync(async (req, res, next) => {
  console.log(`⭐ Actualizando evento ID: ${req.params.id}`);
  console.log('📝 Datos de actualización:', JSON.stringify(req.body, null, 2));

  const {
    title,
    description,
    startDate,
    endDate,
    type,
    origin,
    isWorkRelated,
    trainer,
    client,
    relatedService,
    relatedPaymentPlan,
    relatedRoutinePlan,
    alerts
  } = req.body;

  // Validar que la fecha de inicio sea anterior a la fecha de fin si se proporcionan ambas
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    console.log('❌ Error: Fechas inválidas');
    return next(new AppError('La fecha de inicio debe ser anterior a la fecha de fin', 400));
  }

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      startDate,
      endDate,
      type,
      origin,
      isWorkRelated,
      trainer,
      client,
      relatedService,
      relatedPaymentPlan,
      relatedRoutinePlan,
      alerts
    },
    {
      new: true,
      runValidators: true
    }
  )
  .populate('trainer', 'name email')
  .populate('client', 'name email')
  .populate('relatedService')
  .populate('relatedPaymentPlan')
  .populate('relatedRoutinePlan');

  if (!event) {
    console.log('❌ Evento no encontrado para actualizar');
    return next(new AppError('No se encontró el evento con ese ID', 404));
  }

  console.log('✅ Evento actualizado con éxito');
  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

// Eliminar un evento
exports.deleteEvent = catchAsync(async (req, res, next) => {
  console.log(`⭐ Eliminando evento ID: ${req.params.id}`);

  const event = await Event.findByIdAndDelete(req.params.id);

  if (!event) {
    console.log('❌ Evento no encontrado para eliminar');
    return next(new AppError('No se encontró el evento con ese ID', 404));
  }

  console.log('✅ Evento eliminado con éxito');
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Obtener eventos por cliente
exports.getEventsByClient = catchAsync(async (req, res, next) => {
  const { clientId } = req.params;
  console.log(`⭐ Buscando eventos del cliente ID: ${clientId}`);

  const events = await Event.find({ client: clientId })
    .populate('trainer', 'name email')
    .populate('relatedService')
    .populate('relatedPaymentPlan')
    .populate('relatedRoutinePlan')
    .sort({ startDate: 1 });

  console.log(`✅ Encontrados ${events.length} eventos para el cliente`);
  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});

// Obtener eventos por trainer
exports.getEventsByTrainer = catchAsync(async (req, res, next) => {
  const { trainerId } = req.params;
  console.log(`⭐ Buscando eventos del trainer ID: ${trainerId}`);

  const events = await Event.find({ trainer: trainerId })
    .populate('client', 'name email')
    .populate('relatedService')
    .populate('relatedPaymentPlan')
    .populate('relatedRoutinePlan')
    .sort({ startDate: 1 });

  console.log(`✅ Encontrados ${events.length} eventos para el trainer`);
  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});

// Obtener eventos por rango de fechas
exports.getEventsByDateRange = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  console.log(`⭐ Buscando eventos entre ${startDate} y ${endDate}`);

  if (!startDate || !endDate) {
    console.log('❌ Error: Fechas no proporcionadas');
    return next(new AppError('Se requieren fechas de inicio y fin', 400));
  }

  const events = await Event.find({
    startDate: { $gte: new Date(startDate) },
    endDate: { $lte: new Date(endDate) }
  })
    .populate('trainer', 'name email')
    .populate('client', 'name email')
    .populate('relatedService')
    .populate('relatedPaymentPlan')
    .populate('relatedRoutinePlan')
    .sort({ startDate: 1 });

  console.log(`✅ Encontrados ${events.length} eventos en el rango de fechas`);
  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});
