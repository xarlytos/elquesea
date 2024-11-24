// middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');

// Definir el mismo secreto JWT directamente en el middleware (Solo para pruebas)
const JWT_SECRET = 'tu_secreto_super_seguro'; // Debe ser exactamente el mismo que en los controladores
const JWT_EXPIRES_IN = '24h'; // Tiempo de expiración del token aumentado a 24 horas

// Middleware para verificar el token JWT
const verificarToken = (req, res, next) => {
  console.log('verificarToken - Iniciando verificación del token');

  // Obtener el token del encabezado Authorization
  const authHeader = req.headers['authorization'];
  console.log('verificarToken - Encabezado Authorization:', authHeader);

  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"
  console.log('verificarToken - Token extraído:', token);

  if (!token) {
    console.log('verificarToken - No se proporcionó token');
    return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('verificarToken - Token verificado:', decoded);

    req.user = decoded; // Adjuntar la información del usuario a la solicitud
    console.log('verificarToken - Información del usuario adjuntada a req.user:', req.user);

    next();
  } catch (error) {
    console.error("verificarToken - Error de verificación del token:", error);
    res.status(400).json({ mensaje: 'Token inválido.' });
  }
};

// Middleware para verificar el rol del usuario
const verificarRol = (roles = []) => {
  // roles puede ser un string o un array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    console.log('verificarRol - Verificando roles');

    if (!req.user || !req.user.rol) {
      console.log('verificarRol - Usuario no autenticado o rol no definido');
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes los permisos necesarios.' });
    }

    if (!roles.includes(req.user.rol)) {
      console.log('verificarRol - Rol del usuario no autorizado:', req.user.rol);
      return res.status(403).json({ mensaje: 'Acceso denegado. No tienes los permisos necesarios.' });
    }

    console.log('verificarRol - Rol del usuario autorizado:', req.user.rol);
    next();
  };
};

// Exportar las funciones de middleware
module.exports = {
  verificarToken,
  verificarRol
};
