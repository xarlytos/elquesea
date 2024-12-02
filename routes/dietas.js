// src/routes/dietas.js
const express = require('express');
const router = express.Router();
const dietaController = require('../controllers/dietaController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Middleware para verificar que el usuario es un Trainer
router.use(verificarToken);
router.use(verificarRol('trainer')); // Asumiendo que el rol para entrenadores es 'trainer'

// Rutas para Dietas

// Crear una nueva dieta
router.post('/', dietaController.crearDieta);

// Obtener todas las dietas del entrenador autenticado
router.get('/', dietaController.getAllDietas);

// Nueva ruta para obtener solo las dietas del entrenador autenticado sin populates
router.get('/mis', dietaController.getDietasByTrainer);

// Obtener una dieta específica por ID
router.get('/:id', dietaController.getDietaById);

// Actualizar una dieta por ID
router.put('/:id', dietaController.actualizarDieta);

// Crear nueva semana en una dieta específica
router.post('/:id/semanas', dietaController.crearNuevaSemana);

// Actualizar macros de un día específico
router.put('/:id/dias/:fecha/macros', [
  verificarToken,
  verificarRol(['trainer']),
  // Validaciones adicionales
  check('calorias').isNumeric().toFloat(),
  check('proteinas').isNumeric().toFloat(),
  check('carbohidratos').isNumeric().toFloat(),
  check('grasas').isNumeric().toFloat(),
], dietaController.actualizarMacrosDia);

// Crear una nueva comida en un día específico
router.post('/:id/dias/:fecha/comidas', [
  verificarToken,
  verificarRol(['trainer']),
  check('numero').isNumeric().toFloat(),
  check('peso').isNumeric().toFloat(),
  check('ingredientes').isArray(),
  check('ingredientes.*.nombre').notEmpty(),
  check('ingredientes.*.calorias').isNumeric().toFloat(),
  check('ingredientes.*.proteinas').isNumeric().toFloat(),
  check('ingredientes.*.carbohidratos').isNumeric().toFloat(),
  check('ingredientes.*.grasas').isNumeric().toFloat(),
], dietaController.crearComida);

// Actualizar una comida existente
router.put('/:id/dias/:fecha/comidas/:comidaId', [
  verificarToken,
  verificarRol(['trainer']),
  check('numero').optional().isNumeric().toFloat(),
  check('peso').optional().isNumeric().toFloat(),
  check('ingredientes').optional().isArray(),
  check('ingredientes.*.nombre').optional().notEmpty(),
  check('ingredientes.*.calorias').optional().isNumeric().toFloat(),
  check('ingredientes.*.proteinas').optional().isNumeric().toFloat(),
  check('ingredientes.*.carbohidratos').optional().isNumeric().toFloat(),
  check('ingredientes.*.grasas').optional().isNumeric().toFloat(),
], dietaController.actualizarComida);

// Eliminar una dieta por ID
router.delete('/:id', dietaController.eliminarDieta);

module.exports = router;
