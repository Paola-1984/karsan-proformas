const express = require('express');
const marcasRoutes = require('./routes/marcasRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor de Karsan Proformas funcionando ✅');
});

app.use('/api/marcas', marcasRoutes);
app.use('/api/servicios', serviciosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});