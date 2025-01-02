const { google } = require('googleapis');
const { body, param, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { OAuth2 } = google.auth;
const { verifyGoogleToken } = require('./googleAuthController');

// Configuración del cliente de YouTube
const youtube = google.youtube('v3');
const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);
auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Configuración de OAuth2 para subida de videos
const oauth2Client = new OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);

// Configuración de multer para la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/videos';
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
        const filetypes = /mp4|mov|avi|wmv/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos de video (mp4, mov, avi, wmv)'));
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // Límite de 100MB
    }
}).single('video');

// Validaciones para actualización de video
const updateVideoValidations = [
    param('videoId').notEmpty().withMessage('ID del video es requerido'),
    body('title').optional().isString().trim(),
    body('description').optional().isString().trim(),
];

// Controlador para actualizar metadata del video
const updateVideo = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { videoId } = req.params;
        const { title, description } = req.body;

        // Primero obtener la información actual del video
        const currentVideo = await youtube.videos.list({
            auth,
            part: 'snippet',
            id: videoId
        });

        if (!currentVideo.data.items || currentVideo.data.items.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }

        const snippet = currentVideo.data.items[0].snippet;

        // Actualizar solo los campos proporcionados
        const updateParams = {
            auth,
            part: 'snippet',
            requestBody: {
                id: videoId,
                snippet: {
                    ...snippet,
                    ...(title && { title }),
                    ...(description && { description })
                }
            }
        };

        await youtube.videos.update(updateParams);

        res.status(200).json({
            success: true,
            message: 'Video actualizado correctamente'
        });

    } catch (error) {
        handleYoutubeError(error, res);
    }
};

// Controlador para eliminar video
const deleteVideo = async (req, res) => {
    try {
        const { videoId } = req.params;

        // Verificar si el video existe
        const video = await youtube.videos.list({
            auth,
            part: 'id',
            id: videoId
        });

        if (!video.data.items || video.data.items.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }

        // Eliminar el video
        await youtube.videos.delete({
            auth,
            id: videoId
        });

        res.status(200).json({
            success: true,
            message: 'Video eliminado correctamente'
        });

    } catch (error) {
        handleYoutubeError(error, res);
    }
};

// Controlador para subir video a YouTube
const uploadVideo = async (req, res) => {
    try {
        // Manejar la subida del archivo
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
                    error: 'No se ha proporcionado ningún archivo de video'
                });
            }

            const { title, description, privacy = 'private', tags = [] } = req.body;

            if (!title || !description) {
                return res.status(400).json({
                    success: false,
                    error: 'El título y la descripción son obligatorios'
                });
            }

            try {
                // Verificar y refrescar el token si es necesario
                if (oauth2Client.isTokenExpiring()) {
                    const { tokens } = await oauth2Client.refreshToken(oauth2Client.credentials.refresh_token);
                    oauth2Client.setCredentials(tokens);
                }

                const youtube = google.youtube('v3');

                // Usar el cliente OAuth2 del middleware
                const response = await youtube.videos.insert({
                    auth: req.googleAuth,
                    part: 'snippet,status',
                    requestBody: {
                        snippet: {
                            title,
                            description,
                            tags,
                            defaultLanguage: 'es',
                            defaultAudioLanguage: 'es'
                        },
                        status: {
                            privacyStatus: privacy,
                            selfDeclaredMadeForKids: false
                        }
                    },
                    media: {
                        body: fs.createReadStream(req.file.path)
                    }
                });

                // Eliminar el archivo temporal
                fs.unlinkSync(req.file.path);

                res.status(200).json({
                    success: true,
                    message: 'Video subido exitosamente',
                    videoId: response.data.id,
                    videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`
                });

            } catch (error) {
                // Eliminar el archivo temporal en caso de error
                if (req.file && req.file.path) {
                    fs.unlinkSync(req.file.path);
                }

                console.error('Error al subir el video a YouTube:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error al subir el video a YouTube',
                    details: error.message
                });
            }
        });

    } catch (error) {
        console.error('Error en el controlador de subida:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Función para obtener URL de autorización
const getAuthUrl = (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });

    res.json({
        success: true,
        authUrl: url
    });
};

// Función para manejar el callback de autorización
const handleAuthCallback = async (req, res) => {
    const { code } = req.query;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Aquí podrías guardar los tokens en tu base de datos
        // para uso futuro

        res.json({
            success: true,
            message: 'Autorización completada exitosamente'
        });

    } catch (error) {
        console.error('Error en el callback de autorización:', error);
        res.status(500).json({
            success: false,
            error: 'Error en la autorización'
        });
    }
};

// Manejador de errores de YouTube
const handleYoutubeError = (error, res) => {
    console.error('Error en operación de YouTube:', error);

    if (error.code === 401) {
        return res.status(401).json({
            success: false,
            error: 'Error de autenticación. Token inválido o expirado.'
        });
    }

    if (error.code === 403) {
        return res.status(403).json({
            success: false,
            error: 'No tienes permisos para realizar esta operación'
        });
    }

    if (error.code === 404) {
        return res.status(404).json({
            success: false,
            error: 'Video no encontrado'
        });
    }

    if (error.code === 429) {
        return res.status(429).json({
            success: false,
            error: 'Has excedido el límite de solicitudes. Intenta más tarde.'
        });
    }

    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
};

// Función para obtener lista de videos
const getVideos = async (req, res) => {
    try {
        const { 
            pageSize = 10, 
            pageToken,
            order = 'date',  // date, rating, viewCount, title
            q = ''  // término de búsqueda
        } = req.query;

        const youtube = google.youtube('v3');
        
        const response = await youtube.search.list({
            auth: req.googleAuth,
            part: 'id,snippet',
            type: 'video',
            maxResults: pageSize,
            pageToken: pageToken || '',
            order,
            q,
            forMine: true
        });

        // Obtener estadísticas de los videos
        const videoIds = response.data.items.map(item => item.id.videoId);
        const statsResponse = await youtube.videos.list({
            auth: req.googleAuth,
            part: 'statistics,contentDetails',
            id: videoIds.join(',')
        });

        // Combinar información de videos con estadísticas
        const videos = response.data.items.map(item => {
            const stats = statsResponse.data.items.find(
                statsItem => statsItem.id === item.id.videoId
            );
            return {
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high.url,
                publishedAt: item.snippet.publishedAt,
                statistics: stats ? stats.statistics : {},
                duration: stats ? stats.contentDetails.duration : '',
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`
            };
        });

        res.status(200).json({
            success: true,
            videos,
            pageInfo: {
                totalResults: response.data.pageInfo.totalResults,
                resultsPerPage: response.data.pageInfo.resultsPerPage,
                nextPageToken: response.data.nextPageToken,
                prevPageToken: response.data.prevPageToken
            }
        });

    } catch (error) {
        handleYoutubeError(error, res);
    }
};

// Función para obtener detalles de un video específico
const getVideoDetails = async (req, res) => {
    try {
        const { videoId } = req.params;

        const youtube = google.youtube('v3');

        const response = await youtube.videos.list({
            auth: req.googleAuth,
            part: 'snippet,statistics,contentDetails,status',
            id: videoId
        });

        if (!response.data.items || response.data.items.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }

        const video = response.data.items[0];
        const videoData = {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            thumbnail: video.snippet.thumbnails.high.url,
            tags: video.snippet.tags || [],
            statistics: video.statistics,
            duration: video.contentDetails.duration,
            privacyStatus: video.status.privacyStatus,
            url: `https://www.youtube.com/watch?v=${video.id}`
        };

        res.status(200).json({
            success: true,
            video: videoData
        });

    } catch (error) {
        handleYoutubeError(error, res);
    }
};

module.exports = {
    updateVideoValidations,
    updateVideo,
    deleteVideo,
    uploadVideo,
    getAuthUrl,
    handleAuthCallback,
    getVideos,
    getVideoDetails
};
