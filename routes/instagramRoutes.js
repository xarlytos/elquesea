const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const {
    getAuthUrl,
    handleCallback,
    createPost,
    createStory,
    getPosts,
    disconnect
} = require('../controllers/instagramController');

// Middleware de autenticación para todas las rutas excepto el callback
router.use('/callback', handleCallback);
router.use(verificarToken, verificarRol(['trainer']));

// Rutas de autenticación
router.get('/auth-url', getAuthUrl);
router.post('/disconnect', disconnect);

// Rutas de contenido
router.post('/post', createPost);
router.post('/story', createStory);
router.get('/posts', getPosts);

module.exports = router;
