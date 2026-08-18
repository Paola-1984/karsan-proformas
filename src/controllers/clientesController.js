const pool = require('../config/database');

// Listar todos los clientes
const getClientes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes ORDER BY creado_en DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los clientes' });
  }
};

// Obtener un cliente por id
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el cliente' });
  }
};

// Buscar cliente por identificación (cédula/RUC) - útil para evitar duplicados
const getClienteByIdentificacion = async (req, res) => {
  try {
    const { identificacion } = req.params;
    const [rows] = await pool.query('SELECT * FROM clientes WHERE identificacion = ?', [identificacion]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al buscar el cliente' });
  }
};

// Crear un nuevo cliente
const createCliente = async (req, res) => {
  try {
    const { nombre_razon_social, identificacion, email, telefono, ciudad, tipo_cliente, sector } = req.body;

    if (!nombre_razon_social || !identificacion || !email) {
      return res.status(400).json({ error: 'nombre_razon_social, identificacion y email son obligatorios' });
    }

    const [result] = await pool.query(
      `INSERT INTO clientes (nombre_razon_social, identificacion, email, telefono, ciudad, tipo_cliente, sector)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre_razon_social, identificacion, email, telefono || null, ciudad || null, tipo_cliente || 'NATURAL', sector || null]
    );

    res.status(201).json({ id: result.insertId, mensaje: 'Cliente creado correctamente' });
  } catch (error) {
    // Si la identificación ya existe, MySQL lanza un error de duplicado (código ER_DUP_ENTRY)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un cliente con esa identificación' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear el cliente' });
  }
};

// Editar un cliente existente
const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_razon_social, email, telefono, ciudad, tipo_cliente, sector } = req.body;

    await pool.query(
      `UPDATE clientes 
       SET nombre_razon_social = ?, email = ?, telefono = ?, ciudad = ?, tipo_cliente = ?, sector = ?
       WHERE id = ?`,
      [nombre_razon_social, email, telefono, ciudad, tipo_cliente, sector, id]
    );

    res.json({ mensaje: 'Cliente actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
};

// Para el panel admin: trae todos los clientes como datos puros (sin req/res)
const getClientesParaPanel = async () => {
  const [rows] = await pool.query('SELECT * FROM clientes ORDER BY creado_en DESC');
  return rows;
};

// Para el panel admin: trae un cliente por id como dato puro
const getClienteParaPanel = async (id) => {
  const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = { getClientes, getClienteById, getClienteByIdentificacion, createCliente, updateCliente, getClientesParaPanel, getClienteParaPanel };