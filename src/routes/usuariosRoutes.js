const express = require('express');
const router = express.Router();
const { createUsuario, login, getUsuarios } = require('../controllers/usuariosController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, soloAdmin, createUsuario);
router.post('/login', login);
router.get('/', verificarToken, soloAdmin, getUsuarios);

module.exports = router;