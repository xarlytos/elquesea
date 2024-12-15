const express = require('express');
const router = express.Router();
const {
  getAllEsqueletos,
  getEsqueletoById,
  createEsqueleto,
  addVariant,
  addExerciseToVariant
} = require('../controllers/EsqueletoController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Rutas protegidas que requieren autenticación y rol específico
// Rutas base para esqueletos
router.get('/', verificarToken, getAllEsqueletos);
router.get('/:id', verificarToken, getEsqueletoById);
router.post('/', [verificarToken, verificarRol(['trainer'])], createEsqueleto);

// Rutas para variantes y ejercicios
router.post('/:id/variant', [verificarToken, verificarRol(['trainer'])], addVariant);
router.post('/:esqueletoId/periodo/:periodoId/variant/:variantIndex/exercise', [verificarToken, verificarRol(['trainer'])], addExerciseToVariant);

module.exports = router;
