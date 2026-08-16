const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const marcasRoutes = require('./routes/marcasRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const portafolioRoutes = require('./routes/portafolioRoutes');
const proformasRoutes = require('./routes/proformasRoutes');
const proformaVistaRoutes = require('./routes/proformaVistaRoutes');
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/logos', express.static(path.join(__dirname, 'public/logos')));
app.use('/admin-assets', express.static(path.join(__dirname, 'public/admin-assets')));

app.get('/', (req, res) => {
  res.send('Servidor de Karsan Proformas funcionando ✅');
});

app.use('/api/marcas', marcasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/portafolio', portafolioRoutes);
app.use('/api/proformas', proformasRoutes);
app.use('/proforma', proformaVistaRoutes);
app.use('/admin', adminRoutes);
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});