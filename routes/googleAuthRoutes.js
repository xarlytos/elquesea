const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const {
    getGoogleAuthUrl,
    handleGoogleCallback,
    disconnectGoogle,
    getGoogleConnectionStatus
} = require('../controllers/googleAuthController');

// Ruta pública para el callback de Google
router.get('/callback', handleGoogleCallback);

// Rutas protegidas
router.use(verificarToken, verificarRol(['trainer']));

// Obtener URL de autorización
router.get('/auth-url', getGoogleAuthUrl);

// Desconectar cuenta de Google
router.post('/disconnect', disconnectGoogle);

// Verificar estado de conexión
router.get('/status', getGoogleConnectionStatus);

module.exports = router;
