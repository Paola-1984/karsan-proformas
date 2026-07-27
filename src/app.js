const express = require('express');
const marcasRoutes = require('./routes/marcasRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // permite recibir JSON en el body de las peticiones (necesario para PUT/POST)

app.get('/', (req, res) => {
  res.send('Servidor de Karsan Proformas funcionando ✅');
});

app.use('/api/marcas', marcasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});