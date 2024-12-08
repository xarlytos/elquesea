// routes/incomeRoutes.js

const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Middleware para verificar entrenador
const verificarEntrenador = verificarRol(['trainer']);

// Obtener todos los ingresos del entrenador autenticado
router.get('/', 
  verificarToken, 
  verificarEntrenador, 
  incomeController.obtenerIngresos
);

// Obtener un ingreso específico por ID
router.get('/:id', 
  verificarToken, 
  verificarEntrenador, 
  incomeController.obtenerIngresoPorId
);

// Crear un nuevo ingreso (solo entrenadores pueden hacerlo)
router.post('/', 
  verificarToken, 
  verificarEntrenador, 
  incomeController.crearIngreso
);

// Actualizar el estado de un ingreso
router.patch('/:id/estado', 
  verificarToken, 
  verificarEntrenador, 
  incomeController.actualizarEstadoIngreso
);

// Eliminar un ingreso (solo entrenadores pueden hacerlo)
router.delete('/:id', 
  verificarToken, 
  verificarEntrenador, 
  incomeController.eliminarIngreso
);

module.exports = router;
