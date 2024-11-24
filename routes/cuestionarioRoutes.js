// routes/cuestionarioRoutes.js
const express = require('express');
const router = express.Router();
const {
  crearCuestionario,
  obtenerCuestionarios,
  obtenerCuestionarioPorId,
  actualizarCuestionario,
  eliminarCuestionario,
} = require('../controllers/cuestionarioController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Ruta para crear un nuevo cuestionario
// Solo usuarios autenticados con rol 'Trainer' pueden crear
router.post('/', verificarToken, verificarRol('trainer'), crearCuestionario);

// Ruta para obtener todos los cuestionarios
// Puedes decidir si esta ruta es pública o requiere autenticación
// En este ejemplo, la hacemos accesible solo para entrenadores y clientes
router.get('/', verificarToken, obtenerCuestionarios);

// Ruta para obtener un cuestionario por ID
// Accesible para usuarios autenticados
router.get('/:id', verificarToken, obtenerCuestionarioPorId);

// Ruta para actualizar un cuestionario por ID
// Solo entrenadores pueden actualizar
router.put('/:id', verificarToken, verificarRol('Trainer'), actualizarCuestionario);

// Ruta para eliminar un cuestionario por ID
// Solo entrenadores pueden eliminar
router.delete('/:id', verificarToken, verificarRol('Trainer'), eliminarCuestionario);

module.exports = router;
