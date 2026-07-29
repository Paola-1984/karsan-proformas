const express = require('express');
const router = express.Router();
const { createUsuario, login, getUsuarios } = require('../controllers/usuariosController');

router.post('/', createUsuario);
router.post('/login', login);
router.get('/', getUsuarios);

module.exports = router;