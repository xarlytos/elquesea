const Event = require('../models/Event');
const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Crear un evento
exports.createEvent = async (req, res) => {
  try {
    const { name, type, date, trainer, client, lead } = req.body;

    const newEvent = new Event({ name, type, date, trainer, client, lead });
    const savedEvent = await newEvent.save();

    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los eventos
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('trainer', 'name')
      .populate('client', 'name')
      .populate('lead', 'name');

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un evento por ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('trainer', 'name')
      .populate('client', 'name')
      .populate('lead', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un evento para un cliente
exports.createClientEvent = catchAsync(async (req, res, next) => {
  const { title, description, date, time, clientId } = req.body;

  if (!clientId) {
    return next(new AppError('El ID del cliente es requerido', 400));
  }

  // Verificar que el cliente existe
  const client = await Client.findById(clientId);
  if (!client) {
    return next(new AppError('No se encontró el cliente especificado', 404));
  }

  // Validar que la fecha y hora sean futuras
  const eventDateTime = new Date(`${date}T${time}`);
  if (eventDateTime < new Date()) {
    return next(new AppError('La fecha y hora del evento deben ser futuras', 400));
  }

  const newEvent = await Event.create({
    name: title, // Usando el título como nombre
    description,
    date: eventDateTime,
    client: clientId,
    type: 'Meeting', // Usando un tipo válido del enum
    status: 'scheduled'
  });

  // Añadir el evento al array de eventos del cliente
  client.eventos.push(newEvent._id);
  await client.save();

  const populatedEvent = await Event.findById(newEvent._id)
    .populate('client', 'name email phone');

  res.status(201).json({
    status: 'success',
    data: {
      event: populatedEvent
    }
  });
});

// Obtener eventos de un cliente específico
exports.getClientEvents = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Verificar que el ID sea válido
    if (!clientId || !require('mongoose').Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    // Verificar que el cliente existe
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Obtener todos los eventos del cliente
    const events = await Event.find({ client: clientId })
      .populate('trainer', 'name email')
      .sort({ date: -1 }); // Ordenar por fecha, más recientes primero

    res.status(200).json({
      status: 'success',
      results: events.length,
      data: {
        events
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Error al obtener los eventos del cliente',
      error: error.message 
    });
  }
};
