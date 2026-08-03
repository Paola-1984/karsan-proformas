const express = require('express');
const router = express.Router();
const {
  getPortafolioPorMarca, getPortafolioById, createPortafolio, updatePortafolio, deletePortafolio
} = require('../controllers/portafolioController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/', getPortafolioPorMarca);
router.get('/:id', getPortafolioById);
router.post('/', verificarToken, soloAdmin, createPortafolio);
router.put('/:id', verificarToken, soloAdmin, updatePortafolio);
router.delete('/:id', verificarToken, soloAdmin, deletePortafolio);

module.exports = router;