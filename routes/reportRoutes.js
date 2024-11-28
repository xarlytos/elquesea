// routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Rutas CRUD protegidas
// Solo usuarios autenticados con rol 'trainer' pueden acceder
router.post(
  '/', 
  verificarToken, 
  verificarRol('trainer'), 
  reportController.createReport
);

router.get(
  '/', 
  verificarToken, 
  verificarRol('trainer'), 
  reportController.getReports
);

router.get(
  '/:reportId/insights', 
  verificarToken, 
  verificarRol('trainer'), 
  reportController.generateInsights
);

// **Nueva Ruta: Eliminar Todos los Reportes del Entrenador Autenticado**
router.delete(
  '/all', // Ruta: DELETE /api/reportes/all
  verificarToken,
  verificarRol('trainer'),
  reportController.deleteAllReportsByTrainer
);

module.exports = router;
