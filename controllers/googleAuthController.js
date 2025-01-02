const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const Trainer = require('../models/trainerModel');

// Crear cliente OAuth2
const oauth2Client = new OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);

// Obtener URL de autorización
const getGoogleAuthUrl = (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent', // Forzar el diálogo de consentimiento para obtener refresh_token
        state: req.user._id.toString() // Pasar el ID del trainer como estado
    });

    res.json({
        success: true,
        authUrl
    });
};

// Manejar callback de Google
const handleGoogleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code || !state) {
            return res.status(400).json({
                success: false,
                error: 'Código de autorización o estado no proporcionado'
            });
        }

        // Obtener tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // Buscar el trainer por el ID (state)
        const trainer = await Trainer.findById(state);
        if (!trainer) {
            return res.status(404).json({
                success: false,
                error: 'Trainer no encontrado'
            });
        }

        // Actualizar tokens del trainer
        await trainer.updateGoogleTokens(tokens);

        // Redireccionar a una página de éxito o enviar respuesta JSON
        res.json({
            success: true,
            message: 'Conexión con Google completada exitosamente'
        });

    } catch (error) {
        console.error('Error en callback de Google:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la autenticación de Google'
        });
    }
};

// Desconectar cuenta de Google
const disconnectGoogle = async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.user._id);
        if (!trainer) {
            return res.status(404).json({
                success: false,
                error: 'Trainer no encontrado'
            });
        }

        await trainer.disconnectGoogle();

        res.json({
            success: true,
            message: 'Cuenta de Google desconectada exitosamente'
        });

    } catch (error) {
        console.error('Error al desconectar cuenta de Google:', error);
        res.status(500).json({
            success: false,
            error: 'Error al desconectar la cuenta de Google'
        });
    }
};

// Verificar estado de conexión con Google
const getGoogleConnectionStatus = async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.user._id);
        if (!trainer) {
            return res.status(404).json({
                success: false,
                error: 'Trainer no encontrado'
            });
        }

        res.json({
            success: true,
            isConnected: trainer.googleAuth?.isConnected || false,
            tokenExpiry: trainer.googleAuth?.tokenExpiry
        });

    } catch (error) {
        console.error('Error al verificar estado de conexión:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar el estado de conexión con Google'
        });
    }
};

// Middleware para verificar y refrescar token de Google
const verifyGoogleToken = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.user._id);
        if (!trainer || !trainer.googleAuth?.isConnected) {
            return res.status(401).json({
                success: false,
                error: 'No conectado con Google'
            });
        }

        if (trainer.isGoogleTokenExpired()) {
            oauth2Client.setCredentials({
                refresh_token: trainer.googleAuth.refreshToken
            });

            const { tokens } = await oauth2Client.refreshAccessToken();
            await trainer.updateGoogleTokens(tokens);
        }

        // Configurar cliente OAuth2 con los tokens actuales
        oauth2Client.setCredentials({
            access_token: trainer.googleAuth.accessToken,
            refresh_token: trainer.googleAuth.refreshToken
        });

        req.googleAuth = oauth2Client;
        next();

    } catch (error) {
        console.error('Error al verificar token de Google:', error);
        res.status(401).json({
            success: false,
            error: 'Error de autenticación con Google'
        });
    }
};

module.exports = {
    getGoogleAuthUrl,
    handleGoogleCallback,
    disconnectGoogle,
    getGoogleConnectionStatus,
    verifyGoogleToken
};
