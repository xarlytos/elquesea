const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const {
    uploadVideo,
    getAuthUrl,
    handleAuthCallback,
    updateVideo,
    deleteVideo,
    getVideos,
    getVideoDetails,
    updateVideoValidations
} = require('../controllers/youtubeController');

// Middleware de autenticación para todas las rutas excepto el callback
router.use('/callback', handleAuthCallback);
router.use(verificarToken, verificarRol(['trainer']));

// Ruta para obtener URL de autorización
router.get('/auth', getAuthUrl);

// Ruta para obtener lista de videos
router.get('/videos', getVideos);

// Ruta para obtener detalles de un video específico
router.get('/videos/:videoId', getVideoDetails);

// Ruta para subir video
router.post('/upload', uploadVideo);

// Ruta para actualizar metadata del video
router.put('/videos/:videoId', updateVideoValidations, updateVideo);

// Ruta para eliminar video
router.delete('/videos/:videoId', deleteVideo);

module.exports = router;
