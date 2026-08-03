const express = require('express');
const router = express.Router();
const { createProforma, getProformas, getProformaById, updateEstadoProforma } = require('../controllers/proformasController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, getProformas);
router.get('/:id', verificarToken, getProformaById);
router.post('/', verificarToken, createProforma);
router.put('/:id', verificarToken, updateEstadoProforma);

module.exports = router;