const express = require('express');
const otrosDocumentosController = require('../controllers/otrosDocumentosController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const router = express.Router();

// Proteger todas las rutas
router.use(verificarToken);

// Rutas públicas (requieren token válido)
router.get('/', otrosDocumentosController.getAllDocumentos);
router.get('/:id', otrosDocumentosController.getDocumento);

// Rutas protegidas (solo trainer)
router
    .route('/')
    .post(verificarRol('trainer'), otrosDocumentosController.createDocumento);

router
    .route('/:id')
    .patch(verificarRol('trainer'), otrosDocumentosController.updateDocumento)
    .delete(verificarRol('trainer'), otrosDocumentosController.deleteDocumento);

module.exports = router;
