const express = require('express');
const licenseController = require('../controllers/licenseController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const router = express.Router();

// Proteger todas las rutas con verificación de token
router.use(verificarToken);

// Rutas públicas (solo requieren token válido)
router.get('/', licenseController.getAllLicenses);
router.get('/:id', licenseController.getLicense);

// Rutas protegidas (solo trainer puede crear, actualizar y eliminar)
router
    .route('/')
    .post(verificarRol('trainer'), licenseController.createLicense);

router
    .route('/:id')
    .patch(verificarRol('trainer'), licenseController.updateLicense)
    .delete(verificarRol('trainer'), licenseController.deleteLicense);

module.exports = router;
