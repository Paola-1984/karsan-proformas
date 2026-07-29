const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifica que el usuario haya iniciado sesión (token válido)
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No se proporcionó token de acceso' });
  }

  // El header viene como "Bearer <token>", separamos y tomamos solo el token
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // guardamos los datos del usuario para usarlos después
    next(); // deja continuar hacia el controller
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Verifica que el usuario tenga rol de Admin
const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

module.exports = { verificarToken, soloAdmin };