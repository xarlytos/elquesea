const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} = require('../controllers/leadController');

// Obtener todos los leads
router.get('/', getLeads);

// Obtener un lead por ID
router.get('/:id', getLeadById);

// Crear un nuevo lead
router.post('/', createLead);

// Actualizar un lead por ID
router.put('/:id', updateLead);

// Eliminar un lead por ID
router.delete('/:id', deleteLead);

module.exports = router;
