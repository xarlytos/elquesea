const express = require('express');
const contractController = require('../controllers/contractController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const router = express.Router();

// Proteger todas las rutas
router.use(verificarToken);

// Rutas públicas (requieren token válido)
router.get('/', contractController.getAllContracts);
router.get('/stats', contractController.getContractStats);
router.get('/:id', contractController.getContract);

// Rutas protegidas (solo trainer)
router
    .route('/')
    .post(verificarRol('trainer'), contractController.createContract);

router
    .route('/:id')
    .patch(verificarRol('trainer'), contractController.updateContract)
    .delete(verificarRol('trainer'), contractController.deleteContract);

module.exports = router;
