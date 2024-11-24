const Lead = require('../models/Lead');

// Obtener todos los leads
const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().populate('trainer');
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving leads', error });
  }
};

// Obtener un lead por ID
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('trainer');
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving lead', error });
  }
};

// Crear un nuevo lead
const createLead = async (req, res) => {
  try {
    const { name, email, phone, status, trainer } = req.body;

    const lead = new Lead({
      name,
      email,
      phone,
      status,
      trainer,
    });

    await lead.save();
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lead', error });
  }
};

// Actualizar un lead
const updateLead = async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('trainer');

    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(500).json({ message: 'Error updating lead', error });
  }
};

// Eliminar un lead
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lead', error });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};
