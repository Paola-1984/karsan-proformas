const pool = require('../config/database');

const getMarcas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM marcas WHERE activo = 1');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las marcas' });
  }
};

const getMarcaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM marcas WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Marca no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la marca' });
  }
};

const updateMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre, logo_url, color_primario, color_secundario, correo_remitente,
      telefono, whatsapp, sitio_web, facebook_url, instagram_url, tiktok_url, linkedin_url
    } = req.body;
    await pool.query(
      `UPDATE marcas SET 
        nombre=?, logo_url=?, color_primario=?, color_secundario=?, correo_remitente=?,
        telefono=?, whatsapp=?, sitio_web=?, facebook_url=?, instagram_url=?, tiktok_url=?, linkedin_url=?
       WHERE id=?`,
      [
        nombre, logo_url, color_primario, color_secundario, correo_remitente,
        telefono || null, whatsapp || null, sitio_web || null,
        facebook_url || null, instagram_url || null, tiktok_url || null, linkedin_url || null,
        id
      ]
    );
    res.json({ mensaje: 'Marca actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la marca' });
  }
};

module.exports = { getMarcas, getMarcaById, updateMarca };