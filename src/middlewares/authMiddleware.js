const jwt = require('jsonwebtoken');
require('dotenv').config();

// Extrae el token ya sea del header Authorization (API) o de la cookie 'token' (panel admin)
const extraerToken = (req) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

// Verifica sesión para rutas de API — responde con JSON si falla
const verificarToken = (req, res, next) => {
  const token = extraerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó token de acceso' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Verifica sesión para el panel admin — redirige al login si falla
const verificarTokenPanel = (req, res, next) => {
  const token = extraerToken(req);

  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.redirect('/admin/login');
  }
};

// Verifica que el usuario tenga rol de Admin (se usa igual en ambos contextos)
const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

module.exports = { verificarToken, verificarTokenPanel, soloAdmin };