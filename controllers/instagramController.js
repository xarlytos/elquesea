const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuración de multer para la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/instagram';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Verificar tipo de archivo
        const filetypes = /jpeg|jpg|png|mp4/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos de imagen (JPG, PNG) y video (MP4)'));
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // Límite de 100MB
    }
}).single('media');

// Función para obtener URL de autorización de Instagram
const getAuthUrl = (req, res) => {
    const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${
        process.env.INSTAGRAM_CLIENT_ID
    }&redirect_uri=${
        encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)
    }&scope=user_profile,user_media&response_type=code`;

    res.json({
        success: true,
        authUrl: instagramAuthUrl
    });
};

// Función para manejar el callback de Instagram
const handleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        
        // Intercambiar código por token de acceso
        const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
            code
        });

        // Obtener token de larga duración
        const longLivedTokenResponse = await axios.get('https://graph.instagram.com/access_token', {
            params: {
                grant_type: 'ig_exchange_token',
                client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
                access_token: tokenResponse.data.access_token
            }
        });

        // Obtener información del usuario
        const userResponse = await axios.get('https://graph.instagram.com/me', {
            params: {
                fields: 'id,username',
                access_token: longLivedTokenResponse.data.access_token
            }
        });

        // Actualizar tokens del trainer
        const trainer = await Trainer.findById(req.user._id);
        await trainer.updateInstagramTokens({
            access_token: longLivedTokenResponse.data.access_token,
            user_id: userResponse.data.id,
            username: userResponse.data.username,
            expires_in: longLivedTokenResponse.data.expires_in
        });

        res.json({
            success: true,
            message: 'Conexión con Instagram completada exitosamente'
        });

    } catch (error) {
        console.error('Error en callback de Instagram:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la autenticación de Instagram'
        });
    }
};

// Función para publicar contenido en Instagram
const createPost = async (req, res) => {
    try {
        upload(req, res, async function(err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No se ha proporcionado ningún archivo multimedia'
                });
            }

            const { caption } = req.body;
            const trainer = await Trainer.findById(req.user._id);

            if (!trainer.instagramAuth?.isConnected) {
                return res.status(401).json({
                    success: false,
                    error: 'No conectado con Instagram'
                });
            }

            try {
                // 1. Crear contenedor de medios
                const containerResponse = await axios.post('https://graph.instagram.com/me/media', {
                    image_url: req.file.path, // Aquí necesitarías una URL pública
                    caption: caption,
                    access_token: trainer.instagramAuth.accessToken
                });

                // 2. Publicar contenido
                const publishResponse = await axios.post(`https://graph.instagram.com/me/media_publish`, {
                    creation_id: containerResponse.data.id,
                    access_token: trainer.instagramAuth.accessToken
                });

                // Eliminar archivo temporal
                fs.unlinkSync(req.file.path);

                res.status(200).json({
                    success: true,
                    message: 'Contenido publicado exitosamente',
                    postId: publishResponse.data.id
                });

            } catch (error) {
                // Eliminar archivo temporal en caso de error
                if (req.file && req.file.path) {
                    fs.unlinkSync(req.file.path);
                }

                console.error('Error al publicar en Instagram:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error al publicar en Instagram',
                    details: error.response?.data || error.message
                });
            }
        });

    } catch (error) {
        console.error('Error en el controlador de publicación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Función para crear una historia en Instagram
const createStory = async (req, res) => {
    try {
        upload(req, res, async function(err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No se ha proporcionado ningún archivo multimedia'
                });
            }

            const trainer = await Trainer.findById(req.user._id);

            if (!trainer.instagramAuth?.isConnected) {
                return res.status(401).json({
                    success: false,
                    error: 'No conectado con Instagram'
                });
            }

            try {
                // Crear historia
                const storyResponse = await axios.post('https://graph.instagram.com/me/stories', {
                    image_url: req.file.path, // Aquí necesitarías una URL pública
                    access_token: trainer.instagramAuth.accessToken
                });

                // Eliminar archivo temporal
                fs.unlinkSync(req.file.path);

                res.status(200).json({
                    success: true,
                    message: 'Historia creada exitosamente',
                    storyId: storyResponse.data.id
                });

            } catch (error) {
                // Eliminar archivo temporal en caso de error
                if (req.file && req.file.path) {
                    fs.unlinkSync(req.file.path);
                }

                console.error('Error al crear historia en Instagram:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error al crear historia en Instagram',
                    details: error.response?.data || error.message
                });
            }
        });

    } catch (error) {
        console.error('Error en el controlador de historias:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Función para obtener posts del usuario
const getPosts = async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.user._id);
        
        if (!trainer.instagramAuth?.isConnected) {
            return res.status(401).json({
                success: false,
                error: 'No conectado con Instagram'
            });
        }

        const response = await axios.get(`https://graph.instagram.com/me/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
                access_token: trainer.instagramAuth.accessToken
            }
        });

        res.status(200).json({
            success: true,
            posts: response.data.data
        });

    } catch (error) {
        console.error('Error al obtener posts de Instagram:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener posts de Instagram'
        });
    }
};

// Función para desconectar cuenta
const disconnect = async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.user._id);
        await trainer.disconnectInstagram();

        res.json({
            success: true,
            message: 'Cuenta de Instagram desconectada exitosamente'
        });

    } catch (error) {
        console.error('Error al desconectar cuenta de Instagram:', error);
        res.status(500).json({
            success: false,
            error: 'Error al desconectar la cuenta de Instagram'
        });
    }
};

module.exports = {
    getAuthUrl,
    handleCallback,
    createPost,
    createStory,
    getPosts,
    disconnect
};
