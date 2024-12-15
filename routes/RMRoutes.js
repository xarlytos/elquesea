const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const {
  createRM,
  getAllRMs,
  getRMById,
  updateRM,
  deleteRM,
  getRMsByClient,
  getRMsByExercise
} = require('../controllers/RMController');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas base
router.post('/', createRM); // Crear un RM
router.get('/', getAllRMs); // Obtener todos los RM
router.get('/:id', getRMById); // Obtener un RM por ID
router.put('/:id', updateRM); // Actualizar un RM por ID
router.delete('/:id', deleteRM); // Eliminar un RM por ID

// Rutas adicionales
router.get('/cliente/:clienteId', getRMsByClient);
router.get('/ejercicio/:ejercicioId', getRMsByExercise);

module.exports = router;
