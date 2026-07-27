const pool = require('../config/database');

// Obtener todas las marcas activas
const getMarcas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM marcas WHERE activo = 1');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las marcas' });
  }
};

// Obtener una marca por su id
const getMarcaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM marcas WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la marca' });
  }
};

// Actualizar datos de una marca (colores, logo, correo remitente, etc.)
const updateMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, logo_url, color_primario, color_secundario, correo_remitente } = req.body;

    await pool.query(
      `UPDATE marcas 
       SET nombre = ?, logo_url = ?, color_primario = ?, color_secundario = ?, correo_remitente = ?
       WHERE id = ?`,
      [nombre, logo_url, color_primario, color_secundario, correo_remitente, id]
    );

    res.json({ mensaje: 'Marca actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la marca' });
  }
};

module.exports = { getMarcas, getMarcaById, updateMarca };