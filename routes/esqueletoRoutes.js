const express = require('express');
const router = express.Router();
const esqueletoController = require('../controllers/EsqueletoController');

// Crear un nuevo esqueleto
router.post('/esqueletos', esqueletoController.createEsqueleto);

// Obtener todos los esqueletos
router.get('/esqueletos', esqueletoController.getEsqueletos);

// Obtener un esqueleto por ID
router.get('/esqueletos/:id', esqueletoController.getEsqueletoById);

// Actualizar un esqueleto
router.put('/esqueletos/:id', esqueletoController.updateEsqueleto);

// Eliminar un esqueleto
router.delete('/esqueletos/:id', esqueletoController.deleteEsqueleto);

module.exports = router;
