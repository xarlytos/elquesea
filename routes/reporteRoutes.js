const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Proteger todas las rutas con autenticación
router.use(verificarToken);

// Rutas para reportes
router.route('/')
    .get(reporteController.obtenerReportes)
    .post(reporteController.crearReporte);

router.route('/:id')
    .get(reporteController.obtenerReportePorId)
    .put(reporteController.actualizarReporte)
    .delete(reporteController.eliminarReporte);

module.exports = router;
