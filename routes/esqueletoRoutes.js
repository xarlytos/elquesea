const express = require('express');
const router = express.Router();
const esqueletoController = require('../controllers/EsqueletoController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Rutas protegidas que requieren autenticación y rol específico
// Obtener todos los esqueletos
router.get('/esqueletos', verificarToken, esqueletoController.getAllEsqueletos);

// Obtener un esqueleto por ID
router.get('/esqueletos/:id', verificarToken, esqueletoController.getEsqueletoById);

// Crear un nuevo esqueleto (solo traineres)
router.post('/esqueletos', [verificarToken, verificarRol(['trainer'])], esqueletoController.createEsqueleto);

// Actualizar un esqueleto (solo traineres)
router.put('/esqueletos/:id', [verificarToken, verificarRol(['trainer'])], esqueletoController.updateEsqueleto);

// Eliminar un esqueleto (solo traineres)
router.delete('/esqueletos/:id', [verificarToken, verificarRol(['trainer'])], esqueletoController.deleteEsqueleto);

// Rutas para gestionar variantes
router.post('/esqueletos/:id/variants', [verificarToken, verificarRol(['trainer'])], esqueletoController.addVariant);

// Rutas para gestionar sesiones
router.post('/esqueletos/:esqueletoId/variants/:variantIndex/sessions', [verificarToken, verificarRol(['trainer'])], esqueletoController.addSession);
router.delete('/esqueletos/:esqueletoId/variants/:variantIndex/sessions/:sessionId', [verificarToken, verificarRol(['trainer'])], esqueletoController.deleteSession);

// Rutas para gestionar ejercicios en sesiones
router.post('/esqueletos/:esqueletoId/variants/:variantIndex/sessions/:sessionIndex/exercises', [verificarToken, verificarRol(['trainer'])], esqueletoController.addExerciseToSession);

// Ruta para actualizar la configuración de renderizado de sets
router.patch('/esqueletos/:esqueletoId/variants/:variantIndex/sessions/:sessionIndex/exercises/:exerciseIndex/sets/:setIndex/render-config', [verificarToken, verificarRol(['trainer'])], esqueletoController.updateSetRenderConfig);

module.exports = router;
