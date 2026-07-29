const express = require('express');
const router = express.Router();
const {
  getClientes,
  getClienteById,
  getClienteByIdentificacion,
  createCliente,
  updateCliente
} = require('../controllers/clientesController');

router.get('/', getClientes);
router.get('/buscar/:identificacion', getClienteByIdentificacion);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);

module.exports = router;