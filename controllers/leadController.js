const Lead = require('../models/Lead');
const { validationResult } = require('express-validator');

// Obtener todos los leads del entrenador autenticado
const getLeads = async (req, res) => {
  try {
    console.log('Iniciando proceso para obtener leads...');
    const entrenadorId = req.user.id; // ID del entrenador extraído del token
    console.log('ID del entrenador:', entrenadorId);

    const leads = await Lead.find({ trainer: entrenadorId }).populate('trainer');
    console.log('Leads encontrados:', leads);

    res.status(200).json(leads);
  } catch (error) {
    console.error('Error en getLeads:', error);
    res.status(500).json({ message: 'Error al obtener los leads', error });
  }
};

// Obtener un lead por ID (verificando que pertenezca al entrenador)
const getLeadById = async (req, res) => {
  try {
    console.log('Iniciando proceso para obtener lead por ID...');
    const entrenadorId = req.user.id;
    const leadId = req.params.id;
    console.log('ID del entrenador:', entrenadorId, 'ID del lead:', leadId);

    const lead = await Lead.findById(leadId).populate('trainer');
    console.log('Lead encontrado:', lead);

    if (!lead || lead.trainer.toString() !== entrenadorId) {
      console.warn('Lead no encontrado o no autorizado:', lead);
      return res.status(404).json({ message: 'Lead no encontrado o no autorizado' });
    }

    res.status(200).json(lead);
  } catch (error) {
    console.error('Error en getLeadById:', error);
    res.status(500).json({ message: 'Error al obtener el lead', error });
  }
};

// Crear un nuevo lead
const createLead = async (req, res) => {
  try {
    console.log('Iniciando proceso para crear lead...');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('Errores de validación:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const entrenadorId = req.user.id; // ID del entrenador extraído del token
    const { name, email, phone, status, origen } = req.body;
    console.log('Datos recibidos:', { name, email, phone, status, origen, entrenadorId });

    const lead = new Lead({
      name,
      email,
      phone,
      status,
      origen,
      trainer: entrenadorId,
    });

    const savedLead = await lead.save();
    console.log('Lead creado:', savedLead);

    res.status(201).json(savedLead);
  } catch (error) {
    console.error('Error en createLead:', error);
    res.status(500).json({ message: 'Error al crear el lead', error });
  }
};

// Actualizar un lead (verificando que pertenezca al entrenador)
const updateLead = async (req, res) => {
  try {
    console.log('Iniciando proceso para actualizar lead...');
    const entrenadorId = req.user.id;
    const leadId = req.params.id;
    console.log('ID del entrenador:', entrenadorId, 'ID del lead:', leadId);

    const lead = await Lead.findById(leadId);
    console.log('Lead encontrado para actualizar:', lead);

    if (!lead || lead.trainer.toString() !== entrenadorId) {
      console.warn('Lead no encontrado o no autorizado para actualizar:', lead);
      return res.status(404).json({ message: 'Lead no encontrado o no autorizado' });
    }

    const updatedLead = await Lead.findByIdAndUpdate(leadId, req.body, { new: true }).populate('trainer');
    console.log('Lead actualizado:', updatedLead);

    res.status(200).json(updatedLead);
  } catch (error) {
    console.error('Error en updateLead:', error);
    res.status(500).json({ message: 'Error al actualizar el lead', error });
  }
};

// Eliminar un lead (verificando que pertenezca al entrenador)
const deleteLead = async (req, res) => {
  try {
    console.log('Iniciando proceso para eliminar lead...');
    const entrenadorId = req.user.id;
    const leadId = req.params.id;
    console.log('ID del entrenador:', entrenadorId, 'ID del lead:', leadId);

    const lead = await Lead.findById(leadId);
    console.log('Lead encontrado para eliminar:', lead);

    if (!lead || lead.trainer.toString() !== entrenadorId) {
      console.warn('Lead no encontrado o no autorizado para eliminar:', lead);
      return res.status(404).json({ message: 'Lead no encontrado o no autorizado' });
    }

    await lead.remove();
    console.log('Lead eliminado con éxito:', lead);

    res.status(200).json({ message: 'Lead eliminado correctamente' });
  } catch (error) {
    console.error('Error en deleteLead:', error);
    res.status(500).json({ message: 'Error al eliminar el lead', error });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};
