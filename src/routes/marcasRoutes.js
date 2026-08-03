const express = require('express');
const router = express.Router();
const { getMarcas, getMarcaById, updateMarca } = require('../controllers/marcasController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/', getMarcas);
router.get('/:id', getMarcaById);
router.put('/:id', verificarToken, soloAdmin, updateMarca);

module.exports = router;