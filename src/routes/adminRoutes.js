const express = require('express');
const router = express.Router();
const { loginPanel } = require('../controllers/usuariosController');
const { getProformasParaPanel } = require('../controllers/proformasController');
const { verificarTokenPanel } = require('../middlewares/authMiddleware');

// Mostrar formulario de login
router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

// Procesar login
router.post('/login', loginPanel);

// Cerrar sesión
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin/login');
});

// Listado de proformas
router.get('/proformas', verificarTokenPanel, async (req, res) => {
  try {
    const proformas = await getProformasParaPanel();
    res.render('admin/proformas', { usuario: req.usuario, proformas });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar las proformas');
  }
});

module.exports = router;