const express = require('express');
const router = express.Router();
const { verProforma, actualizarEstadoPublico } = require('../controllers/proformaVistaController');

// Rutas públicas (sin token) — el cliente final accede directo desde el link enviado por correo
router.get('/:numero_correlativo', verProforma);
router.post('/:numero_correlativo/estado', actualizarEstadoPublico);

module.exports = router;