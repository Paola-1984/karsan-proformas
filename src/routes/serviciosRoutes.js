const express = require('express');
const router = express.Router();
const {
  getServicios,
  getServicioById,
  createServicio,
  updateServicio,
  deleteServicio
} = require('../controllers/serviciosController');

router.get('/', getServicios);
router.get('/:id', getServicioById);
router.post('/', createServicio);
router.put('/:id', updateServicio);
router.delete('/:id', deleteServicio);

module.exports = router;