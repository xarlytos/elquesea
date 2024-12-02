// middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');

// Definir el mismo secreto JWT directamente en el middleware (Solo para pruebas)
const JWT_SECRET = 'tu_secreto_super_seguro'; // Debe ser exactamente el mismo que en los controladores
const JWT_EXPIRES_IN = '24h'; // Tiempo de expiración del token aumentado a 24 horas

// Middleware para verificar el token JWT
const verificarToken = async (req, res, next) => {
  console.log('1. Iniciando verificación de token');
  console.log('1.1. Headers recibidos:', req.headers);
  
  try {
    // 1. Obtener el token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('2. Token extraído:', token);
    }

    if (!token) {
      console.log('2.1. No se encontró token');
      return res.status(401).json({
        status: 'error',
        message: 'No estás autorizado. Por favor, inicia sesión.'
      });
    }

    // 2. Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('3. Token decodificado:', decoded);

    // 3. Verificar si el usuario aún existe
    const trainer = await Trainer.findById(decoded.id);
    console.log('4. Trainer encontrado:', trainer);

    if (!trainer) {
      console.log('4.1. No se encontró el trainer en la base de datos');
      return res.status(401).json({
        status: 'error',
        message: 'El usuario ya no existe'
      });
    }

    // 4. Guardar el usuario en req
    req.user = trainer;
    console.log('5. Usuario guardado en req.user:', req.user);
    
    next();
  } catch (error) {
    console.log('Error en verificación:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido o expirado'
    });
  }
};

// Middleware para verificar el rol del usuario
const verificarRol = (roles = []) => {
  return (req, res, next) => {
    console.log('=== VERIFICACIÓN DE ROL ===');
    console.log('Roles permitidos:', roles);
    console.log('Usuario:', req.user);
    console.log('Rol del usuario:', req.user.rol);

    if (!req.user || !req.user.rol) {
      console.log('Error: Usuario no tiene rol definido');
      return res.status(403).json({
        status: 'error',
        message: 'No tienes los permisos necesarios'
      });
    }

    if (!roles.includes(req.user.rol)) {
      console.log('Error: Rol no autorizado');
      console.log('Rol del usuario:', req.user.rol);
      console.log('Roles permitidos:', roles);
      return res.status(403).json({
        status: 'error',
        message: 'No tienes los permisos necesarios para esta acción'
      });
    }

    console.log('Verificación de rol exitosa');
    next();
  };
};

module.exports = {
  verificarToken,
  verificarRol
};
