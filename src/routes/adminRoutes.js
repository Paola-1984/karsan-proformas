const express = require('express');
const router = express.Router();
const { loginPanel } = require('../controllers/usuariosController');
const { getProformasParaPanel } = require('../controllers/proformasController');
const {
  getServiciosParaPanel, getServicioParaPanel, createServicio, updateServicio, deleteServicio
} = require('../controllers/serviciosController');
const {
  getPortafolioParaPanel, getPortafolioByIdParaPanel, createPortafolio, updatePortafolio, deletePortafolio
} = require('../controllers/portafolioController');
const {
  getClientesParaPanel, getClienteParaPanel, createCliente, updateCliente
} = require('../controllers/clientesController');
const { getMarcasParaPanel } = require('../controllers/marcasController');
const { verificarTokenPanel, soloAdmin } = require('../middlewares/authMiddleware');

// Helper: adapta un controlador de API (que espera responder JSON) para que
// en el panel redirija en éxito, o muestre el error en texto plano si falla.
// Cubre tanto res.json(...) directo como res.status(code).json(...).
const adaptarParaPanel = (res, redirectTo) => {
  const manejarBody = (body) => {
    if (body && body.error) {
      return res.status(400).send(`Error: ${body.error}`);
    }
    res.redirect(redirectTo);
  };
  return {
    json: manejarBody,
    status: () => ({ json: manejarBody })
  };
};

// Mostrar formulario de login
router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

// Procesar login
router.post('/login', loginPanel);

// Cerrar sesión
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin/login');
});

// Listado de proformas (ADMIN y ASESOR)
router.get('/proformas', verificarTokenPanel, async (req, res) => {
  try {
    const proformas = await getProformasParaPanel();
    res.render('admin/proformas', { usuario: req.usuario, proformas });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar las proformas');
  }
});

// ---- Clientes (ADMIN y ASESOR) ----

router.get('/clientes', verificarTokenPanel, async (req, res) => {
  try {
    const clientes = await getClientesParaPanel();
    res.render('admin/clientes', { usuario: req.usuario, clientes });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar los clientes');
  }
});

router.get('/clientes/nuevo', verificarTokenPanel, (req, res) => {
  res.render('admin/cliente-form', { usuario: req.usuario, cliente: null });
});

router.post('/clientes/nuevo', verificarTokenPanel, async (req, res) => {
  await createCliente(req, adaptarParaPanel(res, '/admin/clientes'));
});

router.get('/clientes/:id/editar', verificarTokenPanel, async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await getClienteParaPanel(id);
    if (!cliente) return res.status(404).send('Cliente no encontrado');
    res.render('admin/cliente-form', { usuario: req.usuario, cliente });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el formulario');
  }
});

router.post('/clientes/:id/editar', verificarTokenPanel, async (req, res) => {
  await updateCliente(req, adaptarParaPanel(res, '/admin/clientes'));
});

// ---- Catálogo de servicios (solo ADMIN) ----

router.get('/servicios', verificarTokenPanel, soloAdmin, async (req, res) => {
  try {
    const servicios = await getServiciosParaPanel();
    res.render('admin/servicios', { usuario: req.usuario, servicios });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar los servicios');
  }
});

router.get('/servicios/nuevo', verificarTokenPanel, soloAdmin, async (req, res) => {
  try {
    const marcas = await getMarcasParaPanel();
    res.render('admin/servicio-form', { usuario: req.usuario, servicio: null, marcas });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el formulario');
  }
});

router.post('/servicios/nuevo', verificarTokenPanel, soloAdmin, async (req, res) => {
  await createServicio(req, adaptarParaPanel(res, '/admin/servicios'));
});

router.get('/servicios/:id/editar', verificarTokenPanel, soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const servicio = await getServicioParaPanel(id);
    if (!servicio) return res.status(404).send('Servicio no encontrado');
    const marcas = await getMarcasParaPanel();
    res.render('admin/servicio-form', { usuario: req.usuario, servicio, marcas });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el formulario');
  }
});

router.post('/servicios/:id/editar', verificarTokenPanel, soloAdmin, async (req, res) => {
  await updateServicio(req, adaptarParaPanel(res, '/admin/servicios'));
});

router.post('/servicios/:id/eliminar', verificarTokenPanel, soloAdmin, async (req, res) => {
  await deleteServicio(req, adaptarParaPanel(res, '/admin/servicios'));
});

// ---- Portafolio (solo ADMIN) ----

router.get('/portafolio', verificarTokenPanel, soloAdmin, async (req, res) => {
  try {
    const items = await getPortafolioParaPanel();
    res.render('admin/portafolio', { usuario: req.usuario, items });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el portafolio');
  }
});

router.get('/portafolio/nuevo', verificarTokenPanel, soloAdmin, async (req, res) => {
  try {
    const marcas = await getMarcasParaPanel();
    res.render('admin/portafolio-form', { usuario: req.usuario, item: null, marcas });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el formulario');
  }
});

router.post('/portafolio/nuevo', verificarTokenPanel, soloAdmin, async (req, res) => {
  await createPortafolio(req, adaptarParaPanel(res, '/admin/portafolio'));
});

router.get('/portafolio/:id/editar', verificarTokenPanel, soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getPortafolioByIdParaPanel(id);
    if (!item) return res.status(404).send('Elemento de portafolio no encontrado');
    const marcas = await getMarcasParaPanel();
    res.render('admin/portafolio-form', { usuario: req.usuario, item, marcas });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el formulario');
  }
});

router.post('/portafolio/:id/editar', verificarTokenPanel, soloAdmin, async (req, res) => {
  await updatePortafolio(req, adaptarParaPanel(res, '/admin/portafolio'));
});

router.post('/portafolio/:id/eliminar', verificarTokenPanel, soloAdmin, async (req, res) => {
  await deletePortafolio(req, adaptarParaPanel(res, '/admin/portafolio'));
});

module.exports = router;