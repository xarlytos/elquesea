const express = require('express');
const router = express.Router();
const RMController = require('../controllers/RMController');

// Rutas CRUD
router.post('/', RMController.createRM); // Crear un RM
router.get('/', RMController.getAllRMs); // Obtener todos los RM
router.get('/:id', RMController.getRMById); // Obtener un RM por ID
router.put('/:id', RMController.updateRM); // Actualizar un RM por ID
router.delete('/:id', RMController.deleteRM); // Eliminar un RM por ID

module.exports = router;
