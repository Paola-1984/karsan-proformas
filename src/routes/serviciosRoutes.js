const express = require('express');
const router = express.Router();
const {
  getServicios,
  getServicioById,
  createServicio,
  updateServicio,
  deleteServicio
} = require('../controllers/serviciosController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/', getServicios);
router.get('/:id', getServicioById);
router.post('/', verificarToken, soloAdmin, createServicio);
router.put('/:id', verificarToken, soloAdmin, updateServicio);
router.delete('/:id', verificarToken, soloAdmin, deleteServicio);

module.exports = router;