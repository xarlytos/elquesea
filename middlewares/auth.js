const jwt = require('jsonwebtoken');

// Verificar el token de autenticación
const verificarToken = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({
      message: 'No hay token, permiso denegado'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Token no válido'
    });
  }
};

// Verificar rol del usuario
const verificarRol = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Usuario no autorizado'
      });
    }

    next();
  };
};

module.exports = {
  verificarToken,
  verificarRol
};
