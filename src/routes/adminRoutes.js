const express = require('express');
const router = express.Router();
const { loginPanel } = require('../controllers/usuariosController');
const { getProformasParaPanel } = require('../controllers/proformasController');
const {
  getServiciosParaPanel, getServicioParaPanel, createServicio, updateServicio, deleteServicio
} = require('../controllers/serviciosController');
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

// Listado de servicios (solo ADMIN)
router.get('/servicios', verificarTokenPanel, soloAdmin, async (req, res) => {
  try {
    const servicios = await getServiciosParaPanel();
    res.render('admin/servicios', { usuario: req.usuario, servicios });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar los servicios');
  }
});

// Formulario de nuevo servicio (solo ADMIN)
router.get('/servicios/nuevo', verificarTokenPanel, soloAdmin, async (req, res) => {
  try {
    const marcas = await getMarcasParaPanel();
    res.render('admin/servicio-form', { usuario: req.usuario, servicio: null, marcas });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el formulario');
  }
});

// Procesar creación de servicio (solo ADMIN)
router.post('/servicios/nuevo', verificarTokenPanel, soloAdmin, async (req, res) => {
  await createServicio(req, adaptarParaPanel(res, '/admin/servicios'));
});

// Formulario de edición de servicio (solo ADMIN)
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

// Procesar edición de servicio (solo ADMIN)
router.post('/servicios/:id/editar', verificarTokenPanel, soloAdmin, async (req, res) => {
  await updateServicio(req, adaptarParaPanel(res, '/admin/servicios'));
});

// Eliminar (desactivar) servicio (solo ADMIN)
router.post('/servicios/:id/eliminar', verificarTokenPanel, soloAdmin, async (req, res) => {
  await deleteServicio(req, adaptarParaPanel(res, '/admin/servicios'));
});

module.exports = router;