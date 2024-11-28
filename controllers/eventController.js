const Event = require('../models/Event');

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
