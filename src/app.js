const express = require('express');
const marcasRoutes = require('./routes/marcasRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor de Karsan Proformas funcionando ✅');
});

app.use('/api/marcas', marcasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});