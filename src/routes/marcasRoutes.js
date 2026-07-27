const express = require('express');
const router = express.Router();
const { getMarcas, getMarcaById, updateMarca } = require('../controllers/marcasController');

router.get('/', getMarcas);
router.get('/:id', getMarcaById);
router.put('/:id', updateMarca);

module.exports = router;