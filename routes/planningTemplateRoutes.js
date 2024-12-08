const express = require('express');
const router = express.Router();
const planningTemplateController = require('../controllers/PlanningTemplateController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Rutas base para plantillas
router.get('/templates', [verificarToken], planningTemplateController.getAllTemplates);
router.get('/templates/:templateId', [verificarToken], planningTemplateController.getTemplateById);
router.get('/templates/:templateId/basic', [verificarToken], planningTemplateController.getTemplateBasicData);
router.post('/templates', [verificarToken, verificarRol(['trainer'])], planningTemplateController.createTemplate);
router.put('/templates/:templateId', [verificarToken, verificarRol(['trainer'])], planningTemplateController.updateTemplate);
router.delete('/templates/:templateId', [verificarToken, verificarRol(['trainer'])], planningTemplateController.deleteTemplate);

// Rutas para operaciones especiales
router.post('/templates/:templateId/clone', [verificarToken, verificarRol(['trainer'])], planningTemplateController.cloneTemplate);
router.post('/templates/:templateId/assign', [verificarToken, verificarRol(['trainer'])], planningTemplateController.assignClient);
router.patch('/templates/:templateId/clients/:clientId/exercises', [verificarToken, verificarRol(['trainer'])], planningTemplateController.modifyClientExercise);

// Rutas para gestionar sesiones
router.post('/templates/:templateId/weeks/:weekNumber/days/:dayNumber/sessions', [verificarToken, verificarRol(['trainer'])], planningTemplateController.createTemplateSession);
router.put('/templates/:templateId/weeks/:weekNumber/days/:dayNumber/sessions/:sessionIndex', [verificarToken, verificarRol(['trainer'])], planningTemplateController.updateTemplateSession);
router.delete('/templates/:templateId/weeks/:weekNumber/days/:dayNumber/sessions/:sessionIndex', [verificarToken, verificarRol(['trainer'])], planningTemplateController.deleteTemplateSession);

// Rutas para gestionar ejercicios en sesiones
router.post('/templates/:templateId/weeks/:weekNumber/days/:dayNumber/sessions/:sessionIndex/exercises', [verificarToken, verificarRol(['trainer'])], planningTemplateController.addExerciseToTemplateSession);
router.put('/templates/:templateId/weeks/:weekNumber/days/:dayNumber/sessions/:sessionIndex/exercises/:exerciseIndex', [verificarToken, verificarRol(['trainer'])], planningTemplateController.updateTemplateExercise);

module.exports = router;
