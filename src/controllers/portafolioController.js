const pool = require('../config/database');

const getPortafolioPorMarca = async (req, res) => {
  try {
    const { marca_id } = req.query;
    let query = 'SELECT * FROM portafolio WHERE activo = 1';
    const params = [];
    if (marca_id) { query += ' AND marca_id = ?'; params.push(marca_id); }
    query += ' ORDER BY orden ASC, id ASC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el portafolio' });
  }
};

const getPortafolioById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM portafolio WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Elemento de portafolio no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el elemento de portafolio' });
  }
};

const createPortafolio = async (req, res) => {
  try {
    const { marca_id, titulo, descripcion, iframe_embed, orden } = req.body;

    if (!marca_id || !iframe_embed) {
      return res.status(400).json({ error: 'marca_id e iframe_embed son obligatorios' });
    }

    const [result] = await pool.query(
      `INSERT INTO portafolio (marca_id, titulo, descripcion, iframe_embed, orden) VALUES (?, ?, ?, ?, ?)`,
      [marca_id, titulo || null, descripcion || null, iframe_embed, orden ?? 0]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Elemento de portafolio creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el elemento de portafolio' });
  }
};

const updatePortafolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, iframe_embed, orden } = req.body;

    if (!iframe_embed) {
      return res.status(400).json({ error: 'iframe_embed es obligatorio' });
    }

    const [result] = await pool.query(
      `UPDATE portafolio SET titulo=?, descripcion=?, iframe_embed=?, orden=? WHERE id=?`,
      [titulo || null, descripcion || null, iframe_embed, orden ?? 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Elemento de portafolio no encontrado' });
    res.json({ mensaje: 'Elemento de portafolio actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el elemento de portafolio' });
  }
};

const deletePortafolio = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE portafolio SET activo = 0 WHERE id = ?', [id]);
    res.json({ mensaje: 'Elemento de portafolio desactivado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar el elemento de portafolio' });
  }
};

// Para el panel admin: trae todos los elementos de portafolio activos con nombre de marca resuelto
const getPortafolioParaPanel = async () => {
  const [rows] = await pool.query(`
    SELECT
      p.id, p.marca_id, p.titulo, p.descripcion, p.iframe_embed, p.orden,
      m.nombre AS marca_nombre
    FROM portafolio p
    JOIN marcas m ON p.marca_id = m.id
    WHERE p.activo = 1
    ORDER BY m.nombre, p.orden ASC, p.id ASC
  `);
  return rows;
};

// Para el panel admin: trae un elemento de portafolio por id como dato puro
const getPortafolioByIdParaPanel = async (id) => {
  const [rows] = await pool.query('SELECT * FROM portafolio WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = { getPortafolioPorMarca, getPortafolioById, createPortafolio, updatePortafolio, deletePortafolio, getPortafolioParaPanel, getPortafolioByIdParaPanel };