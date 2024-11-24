// routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Rutas CRUD
router.post('/', reportController.createReport);
router.get('/', reportController.getReports);
router.get('/:reportId/insights', reportController.generateInsights);

module.exports = router;
