const express = require('express');
const bonoController = require('../controllers/bonoController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const router = express.Router();

// Proteger todas las rutas
router.use(verificarToken);

// Rutas públicas (requieren token válido)
router.get('/', bonoController.getAllBonos);
router.get('/:id', bonoController.getBono);

// Rutas protegidas (solo trainer)
router
    .route('/')
    .post(verificarRol('trainer'), bonoController.createBono);

router
    .route('/:id')
    .patch(verificarRol('trainer'), bonoController.updateBono)
    .delete(verificarRol('trainer'), bonoController.deleteBono);

// Ruta especial para usar una sesión
router.patch('/:id/usar-sesion', verificarRol('trainer'), bonoController.usarSesion);

module.exports = router;
