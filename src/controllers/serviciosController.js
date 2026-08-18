const pool = require('../config/database');

// Valida que la combinación de precios sea coherente con las reglas de negocio
const validarPrecios = ({ es_editable, precio_unico, precio_plan_anual, precio_plan_trimestral }) => {
  const tieneUnico = precio_unico !== undefined && precio_unico !== null;
  const tieneAnual = precio_plan_anual !== undefined && precio_plan_anual !== null;
  const tieneTrimestral = precio_plan_trimestral !== undefined && precio_plan_trimestral !== null;

  if (!es_editable) {
    if (!tieneUnico) {
      return 'Los servicios no editables (catálogo fijo) requieren precio_unico';
    }
    if (tieneAnual || tieneTrimestral) {
      return 'Los servicios no editables no pueden tener precio_plan_anual ni precio_plan_trimestral';
    }
    return null;
  }

  const combinacionPlan = tieneAnual && tieneTrimestral && !tieneUnico;
  const combinacionUnico = tieneUnico && !tieneAnual && !tieneTrimestral;

  if (!combinacionPlan && !combinacionUnico) {
    return 'Debe enviar (precio_plan_anual + precio_plan_trimestral) O precio_unico, nunca una combinación distinta ni ambos pares a la vez';
  }
  if (tieneAnual && !tieneTrimestral) {
    return 'Si envía precio_plan_anual también debe enviar precio_plan_trimestral';
  }
  if (tieneTrimestral && !tieneAnual) {
    return 'Si envía precio_plan_trimestral también debe enviar precio_plan_anual';
  }

  return null;
};

// Limpia los campos de precio que no correspondan según es_editable,
// para que el cliente (Thunder Client, frontend futuro) no tenga que
// enviar null explícito en cada campo irrelevante.
const normalizarPrecios = ({ es_editable, precio_unico, precio_plan_anual, precio_plan_trimestral }) => {
  if (!es_editable) {
    return {
      precio_unico: precio_unico ?? null,
      precio_plan_anual: null,
      precio_plan_trimestral: null
    };
  }

  const tieneUnico = precio_unico !== undefined && precio_unico !== null;
  if (tieneUnico) {
    return {
      precio_unico,
      precio_plan_anual: null,
      precio_plan_trimestral: null
    };
  }

  return {
    precio_unico: null,
    precio_plan_anual: precio_plan_anual ?? null,
    precio_plan_trimestral: precio_plan_trimestral ?? null
  };
};

const getServicios = async (req, res) => {
  try {
    const { marca_id, categoria } = req.query;
    let query = 'SELECT * FROM servicios_catalogo WHERE activo = 1';
    const params = [];
    if (marca_id) { query += ' AND marca_id = ?'; params.push(marca_id); }
    if (categoria) { query += ' AND categoria = ?'; params.push(categoria); }
    query += ' ORDER BY categoria, nombre';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los servicios' });
  }
};

const getServicioById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM servicios_catalogo WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el servicio' });
  }
};

const createServicio = async (req, res) => {
  try {
    const {
      marca_id, nombre, descripcion, precio_base, iva_porcentaje, es_editable,
      precio_plan_anual, precio_plan_trimestral, precio_unico, categoria
    } = req.body;

    if (!marca_id || !nombre || precio_base === undefined) {
      return res.status(400).json({ error: 'marca_id, nombre y precio_base son obligatorios' });
    }

    const esEditableFinal = es_editable ?? false;
    const precios = normalizarPrecios({
      es_editable: esEditableFinal,
      precio_unico, precio_plan_anual, precio_plan_trimestral
    });

    const errorPrecios = validarPrecios({ es_editable: esEditableFinal, ...precios });
    if (errorPrecios) {
      return res.status(400).json({ error: errorPrecios });
    }

    const [result] = await pool.query(
      `INSERT INTO servicios_catalogo 
        (marca_id, nombre, descripcion, precio_base, iva_porcentaje, es_editable, 
         precio_plan_anual, precio_plan_trimestral, precio_unico, categoria) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        marca_id, nombre, descripcion || null, precio_base, iva_porcentaje ?? 15.00, esEditableFinal,
        precios.precio_plan_anual, precios.precio_plan_trimestral, precios.precio_unico, categoria || null
      ]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Servicio creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el servicio' });
  }
};

const updateServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre, descripcion, precio_base, iva_porcentaje, es_editable,
      precio_plan_anual, precio_plan_trimestral, precio_unico, categoria
    } = req.body;

    const esEditableFinal = es_editable ?? false;
    const precios = normalizarPrecios({
      es_editable: esEditableFinal,
      precio_unico, precio_plan_anual, precio_plan_trimestral
    });

    const errorPrecios = validarPrecios({ es_editable: esEditableFinal, ...precios });
    if (errorPrecios) {
      return res.status(400).json({ error: errorPrecios });
    }

    await pool.query(
      `UPDATE servicios_catalogo 
       SET nombre=?, descripcion=?, precio_base=?, iva_porcentaje=?, es_editable=?, 
           precio_plan_anual=?, precio_plan_trimestral=?, precio_unico=?, categoria=? 
       WHERE id=?`,
      [
        nombre, descripcion, precio_base, iva_porcentaje, esEditableFinal,
        precios.precio_plan_anual, precios.precio_plan_trimestral, precios.precio_unico, categoria || null,
        id
      ]
    );
    res.json({ mensaje: 'Servicio actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el servicio' });
  }
};

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

// Para el panel admin: trae servicios con nombre de marca resuelto (JOIN)
const getServiciosParaPanel = async () => {
  const [rows] = await pool.query(`
    SELECT
      s.id, s.nombre, s.descripcion, s.precio_base, s.iva_porcentaje, s.es_editable,
      s.precio_plan_anual, s.precio_plan_trimestral, s.precio_unico, s.categoria,
      m.nombre AS marca_nombre, m.id AS marca_id
    FROM servicios_catalogo s
    JOIN marcas m ON s.marca_id = m.id
    WHERE s.activo = 1
    ORDER BY m.nombre, s.categoria, s.nombre
  `);
  return rows;
};

// Para el panel admin: trae un servicio por id como dato puro (sin req/res)
const getServicioParaPanel = async (id) => {
  const [rows] = await pool.query('SELECT * FROM servicios_catalogo WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};
module.exports = { getServicios, getServicioById, createServicio, updateServicio, deleteServicio, getServiciosParaPanel, getServicioParaPanel };