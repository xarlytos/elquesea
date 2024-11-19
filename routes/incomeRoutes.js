// routes/incomeRoutes.js

const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Obtener todos los ingresos del entrenador autenticado
router.get('/', verificarToken, verificarRol(['trainer']), incomeController.obtenerIngresos);

// Obtener un ingreso específico por ID
router.get('/:id', verificarToken, verificarRol(['trainer']), incomeController.obtenerIngresoPorId);

// Crear un nuevo ingreso (solo entrenadores pueden hacerlo)
router.post('/', verificarToken, verificarRol(['trainer']), incomeController.crearIngreso);

// Eliminar un ingreso (solo entrenadores pueden hacerlo)
router.delete('/:id', verificarToken, verificarRol(['trainer']), incomeController.eliminarIngreso);

module.exports = router;
