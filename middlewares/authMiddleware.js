const jwt = require('jsonwebtoken');

// Middleware para verificar el token
const verificarToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log("🔑 Token recibido:", token); // Log del token recibido

  if (!token) {
    console.error('🚫 No se proporcionó token');
    return res.status(401).json({ mensaje: 'No se proporcionó token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔓 Token decodificado:", decoded); // Log del token decodificado

    req.user = decoded;  // `req.user` ahora tiene `id` y `rol`
    next();
  } catch (error) {
    console.error("❌ Error de verificación del token:", error.message);  // Log del error de verificación
    res.status(401).json({ mensaje: 'Token no válido' });
  }
};

// Middleware para verificar el rol del usuario
const verificarRol = (rolesPermitidos) => (req, res, next) => {
  console.log("👤 Rol del usuario:", req.user.rol);  // Log del rol del usuario
  console.log("🔍 Roles permitidos:", rolesPermitidos);  // Log de roles permitidos

  if (!rolesPermitidos.includes(req.user.rol)) {
    console.error('🚫 Acceso denegado, rol no autorizado');
    return res.status(403).json({ mensaje: 'Acceso denegado, rol no autorizado' });
  }
  next();
};

module.exports = { verificarToken, verificarRol };
