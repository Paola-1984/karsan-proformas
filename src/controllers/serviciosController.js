const pool = require('../config/database');

// Listar servicios/cursos, opcionalmente filtrados por marca
const getServicios = async (req, res) => {
  try {
    const { marca_id } = req.query; // ej: /api/servicios?marca_id=1
    let query = 'SELECT * FROM servicios_catalogo WHERE activo = 1';
    const params = [];

    if (marca_id) {
      query += ' AND marca_id = ?';
      params.push(marca_id);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los servicios' });
  }
};

// Obtener un servicio por id
const getServicioById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM servicios_catalogo WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el servicio' });
  }
};

// Crear un nuevo servicio/curso
const createServicio = async (req, res) => {
  try {
    const { marca_id, nombre, descripcion, precio_base, iva_porcentaje, es_editable } = req.body;

    if (!marca_id || !nombre || precio_base === undefined) {
      return res.status(400).json({ error: 'marca_id, nombre y precio_base son obligatorios' });
    }

    const [result] = await pool.query(
      `INSERT INTO servicios_catalogo (marca_id, nombre, descripcion, precio_base, iva_porcentaje, es_editable)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [marca_id, nombre, descripcion || null, precio_base, iva_porcentaje ?? 15.00, es_editable ?? false]
    );

    res.status(201).json({ id: result.insertId, mensaje: 'Servicio creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el servicio' });
  }
};

// Editar un servicio existente
const updateServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio_base, iva_porcentaje, es_editable } = req.body;

    await pool.query(
      `UPDATE servicios_catalogo 
       SET nombre = ?, descripcion = ?, precio_base = ?, iva_porcentaje = ?, es_editable = ?
       WHERE id = ?`,
      [nombre, descripcion, precio_base, iva_porcentaje, es_editable, id]
    );

    res.json({ mensaje: 'Servicio actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el servicio' });
  }
};

// Desactivar un servicio (no se borra físicamente, para no perder histórico en proformas ya emitidas)
const deleteServicio = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE servicios_catalogo SET activo = 0 WHERE id = ?', [id]);
    res.json({ mensaje: 'Servicio desactivado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar el servicio' });
  }
};

module.exports = { getServicios, getServicioById, createServicio, updateServicio, deleteServicio };