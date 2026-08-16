const pool = require('../config/database');
const { enviarCorreoProforma } = require('../services/emailService');

// Genera el siguiente número correlativo para una marca (ej: ESC-0007 -> ESC-0008)
// Usa FOR UPDATE para bloquear la última fila de esa marca y evitar duplicados
// si dos proformas se crean casi al mismo tiempo.
const generarNumeroCorrelativo = async (connection, marca_id, prefijo) => {
  const [rows] = await connection.query(
    'SELECT numero_correlativo FROM proformas WHERE marca_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
    [marca_id]
  );

  let siguiente = 1;
  if (rows.length > 0) {
    const partes = rows[0].numero_correlativo.split('-');
    const numeroActual = parseInt(partes[1], 10);
    if (!isNaN(numeroActual)) siguiente = numeroActual + 1;
  }

  return `${prefijo}-${String(siguiente).padStart(4, '0')}`;
};

// Calcula la fecha de vencimiento según la marca y los datos de la proforma
const calcularFechaVencimiento = async (connection, marca, fechaEmision, fechaInicioCursoBody, lineas) => {
  if (marca.slug !== 'escuela') {
    // Agencia (BACH): +15 días automático
    const vencimiento = new Date(fechaEmision);
    vencimiento.setDate(vencimiento.getDate() + 15);
    return { fecha: vencimiento.toISOString().split('T')[0], error: null };
  }

  // Escuela: usa fecha_inicio_curso explícita del body si viene
  if (fechaInicioCursoBody) {
    return { fecha: fechaInicioCursoBody, error: null };
  }

  // Si no, busca el default en el catálogo de la primera línea que tenga servicio_id
  for (const linea of lineas) {
    if (linea.servicio_id) {
      const [rows] = await connection.query(
        'SELECT fecha_inicio_curso FROM servicios_catalogo WHERE id = ?',
        [linea.servicio_id]
      );
      if (rows.length > 0 && rows[0].fecha_inicio_curso) {
        const fecha = rows[0].fecha_inicio_curso.toISOString
          ? rows[0].fecha_inicio_curso.toISOString().split('T')[0]
          : rows[0].fecha_inicio_curso;
        return { fecha, error: null };
      }
    }
  }

  return {
    fecha: null,
    error: 'No se pudo determinar fecha_vencimiento: falta fecha_inicio_curso en el body o en el catálogo del servicio cotizado'
  };
};

// Determina el precio_unitario de una línea según el tipo de precio elegido
const resolverPrecioUnitario = (servicio, tipoPrecio, precioManual) => {
  // Servicio editable con precio_base 0.00 (ej. "Movilización para grabaciones"): precio 100% manual
  if (servicio.es_editable && precioManual !== undefined && precioManual !== null) {
    return { precio: Number(precioManual), error: null };
  }

  if (!servicio.es_editable) {
    // Catálogo fijo (Escuela): siempre precio_unico
    if (servicio.precio_unico === null) {
      return { precio: null, error: `El servicio "${servicio.nombre}" no tiene precio_unico configurado` };
    }
    return { precio: Number(servicio.precio_unico), error: null };
  }

  // Catálogo editable (BACH)
  if (tipoPrecio === 'plan_anual') {
    if (servicio.precio_plan_anual === null) return { precio: null, error: `El servicio "${servicio.nombre}" no tiene precio_plan_anual` };
    return { precio: Number(servicio.precio_plan_anual), error: null };
  }
  if (tipoPrecio === 'plan_trimestral') {
    if (servicio.precio_plan_trimestral === null) return { precio: null, error: `El servicio "${servicio.nombre}" no tiene precio_plan_trimestral` };
    return { precio: Number(servicio.precio_plan_trimestral), error: null };
  }
  if (tipoPrecio === 'unico') {
    if (servicio.precio_unico === null) return { precio: null, error: `El servicio "${servicio.nombre}" no tiene precio_unico` };
    return { precio: Number(servicio.precio_unico), error: null };
  }

  return { precio: null, error: `tipo_precio inválido o faltante para el servicio "${servicio.nombre}" (use plan_anual, plan_trimestral o unico)` };
};

const createProforma = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      marca_id, cliente_id, descuento_general_porcentaje, fecha_inicio_curso,
      condiciones_pago, lineas
    } = req.body;

    const usuario_id = req.usuario.id;

    if (!marca_id || !cliente_id || !Array.isArray(lineas) || lineas.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'marca_id, cliente_id y al menos una línea (lineas[]) son obligatorios' });
    }

    // Consulta el descuento máximo ACTUAL del usuario (no confía en el token, que puede estar desactualizado)
    const [usuarioRows] = await pool.query('SELECT descuento_max_permitido FROM usuarios WHERE id = ?', [usuario_id]);
    if (usuarioRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const descuentoMaxUsuario = Number(usuarioRows[0].descuento_max_permitido ?? 10.00);

    const descGeneralPct = Number(descuento_general_porcentaje ?? 0);
    if (descGeneralPct > descuentoMaxUsuario) {
      connection.release();
      return res.status(400).json({
        error: `El descuento general (${descGeneralPct}%) excede el máximo permitido para este usuario (${descuentoMaxUsuario}%)`
      });
    }

    await connection.beginTransaction();

    // 1. Obtener datos de la marca (prefijo, slug)
    const [marcaRows] = await connection.query('SELECT * FROM marcas WHERE id = ?', [marca_id]);
    if (marcaRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    const marca = marcaRows[0];

    // 2. Validar cliente
    const [clienteRows] = await connection.query('SELECT * FROM clientes WHERE id = ?', [cliente_id]);
    if (clienteRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // 3. Resolver cada línea: precio, descuento, IVA
    const lineasResueltas = [];
    for (const linea of lineas) {
      const { servicio_id, descripcion_custom, cantidad, tipo_precio, precio_unitario_manual, descuento_linea_porcentaje, iva_porcentaje_override } = linea;
      const cant = Number(cantidad ?? 1);
      const descLineaPct = Number(descuento_linea_porcentaje ?? 0);

      if (descLineaPct > descuentoMaxUsuario) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: `El descuento de una línea (${descLineaPct}%) excede el máximo permitido para este usuario (${descuentoMaxUsuario}%)`
        });
      }

      let precioUnitario, ivaPorcentaje, descripcionFinal;

      if (servicio_id) {
        const [servicioRows] = await connection.query('SELECT * FROM servicios_catalogo WHERE id = ? AND activo = 1', [servicio_id]);
        if (servicioRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ error: `Servicio con id ${servicio_id} no encontrado o inactivo` });
        }
        const servicio = servicioRows[0];

        const { precio, error } = resolverPrecioUnitario(servicio, tipo_precio, precio_unitario_manual);
        if (error) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ error });
        }
        precioUnitario = precio;
        ivaPorcentaje = Number(iva_porcentaje_override ?? servicio.iva_porcentaje);
        descripcionFinal = descripcion_custom || servicio.nombre;
      } else {
        // Línea 100% personalizada (sin servicio_id)
        if (!descripcion_custom || precio_unitario_manual === undefined) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ error: 'Las líneas sin servicio_id requieren descripcion_custom y precio_unitario_manual' });
        }
        precioUnitario = Number(precio_unitario_manual);
        ivaPorcentaje = Number(iva_porcentaje_override ?? 15.00);
        descripcionFinal = descripcion_custom;
      }

      const baseLinea = cant * precioUnitario;
      const descLineaMonto = baseLinea * (descLineaPct / 100);
      const netoLinea = baseLinea - descLineaMonto;

      lineasResueltas.push({
        servicio_id: servicio_id || null,
        descripcion_custom: descripcionFinal,
        cantidad: cant,
        precio_unitario: precioUnitario,
        descuento_linea: descLineaMonto,
        iva_porcentaje: ivaPorcentaje,
        netoLinea
      });
    }

    // 4. Fecha de vencimiento
    const fechaEmision = new Date().toISOString().split('T')[0];
    const { fecha: fechaVencimiento, error: errorFecha } = await calcularFechaVencimiento(
      connection, marca, fechaEmision, fecha_inicio_curso, lineas
    );
    if (errorFecha) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: errorFecha });
    }

    // 5. Aplicar descuento general proporcionalmente y calcular IVA por línea
    const subtotalGeneral = lineasResueltas.reduce((sum, l) => sum + l.netoLinea, 0);
    const descGeneralMonto = subtotalGeneral * (descGeneralPct / 100);
    const factorGeneral = subtotalGeneral > 0 ? (subtotalGeneral - descGeneralMonto) / subtotalGeneral : 1;

    let montoIvaTotal = 0;
    let totalGeneral = 0;
    for (const l of lineasResueltas) {
      const netoConGeneral = l.netoLinea * factorGeneral;
      const ivaLinea = netoConGeneral * (l.iva_porcentaje / 100);
      l.subtotal_linea = netoConGeneral;
      montoIvaTotal += ivaLinea;
      totalGeneral += netoConGeneral + ivaLinea;
    }
    const subtotalFinal = subtotalGeneral - descGeneralMonto;

    // 6. Numeración correlativa
    const numeroCorrelativo = await generarNumeroCorrelativo(connection, marca_id, marca.prefijo_correlativo);

    // 7. Insertar encabezado
    const [proformaResult] = await connection.query(
      `INSERT INTO proformas
        (marca_id, cliente_id, usuario_id, numero_correlativo, fecha_emision, fecha_vencimiento,
         subtotal, descuento_general, monto_iva, total, condiciones_pago)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        marca_id, cliente_id, usuario_id, numeroCorrelativo, fechaEmision, fechaVencimiento,
        subtotalFinal.toFixed(2), descGeneralMonto.toFixed(2), montoIvaTotal.toFixed(2), totalGeneral.toFixed(2),
        condiciones_pago || null
      ]
    );
    const proformaId = proformaResult.insertId;

    // 8. Insertar líneas
    for (const l of lineasResueltas) {
      await connection.query(
        `INSERT INTO proforma_detalles
          (proforma_id, servicio_id, descripcion_custom, cantidad, precio_unitario, descuento_linea, subtotal_linea, iva_porcentaje)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          proformaId, l.servicio_id, l.descripcion_custom, l.cantidad, l.precio_unitario.toFixed(2),
          l.descuento_linea.toFixed(2), l.subtotal_linea.toFixed(2), l.iva_porcentaje
        ]
      );
    }

    await connection.commit();
    connection.release();

    // Envío automático de correo (no bloquea la respuesta si falla)
    let correoResultado = { exito: false, error: 'No se intentó enviar' };
    try {
      correoResultado = await enviarCorreoProforma({
        marca,
        cliente: clienteRows[0],
        proforma: {
          numero_correlativo: numeroCorrelativo,
          total: totalGeneral
        }
      });
    } catch (errorCorreo) {
      console.error('Error al enviar correo de proforma:', errorCorreo);
      correoResultado = { exito: false, error: errorCorreo.message };
    }

    res.status(201).json({
      id: proformaId,
      numero_correlativo: numeroCorrelativo,
      mensaje: 'Proforma creada correctamente',
      correo_enviado: correoResultado.exito,
      correo_error: correoResultado.exito ? undefined : correoResultado.error
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error(error);
    res.status(500).json({ error: 'Error al crear la proforma' });
  }
};

const getProformas = async (req, res) => {
  try {
    const { marca_id, estado } = req.query;
    let query = 'SELECT * FROM proformas WHERE 1=1';
    const params = [];
    if (marca_id) { query += ' AND marca_id = ?'; params.push(marca_id); }
    if (estado) { query += ' AND estado = ?'; params.push(estado); }
    query += ' ORDER BY creado_en DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las proformas' });
  }
};

const getProformaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [proformaRows] = await pool.query('SELECT * FROM proformas WHERE id = ?', [id]);
    if (proformaRows.length === 0) return res.status(404).json({ error: 'Proforma no encontrada' });

    const [detalles] = await pool.query('SELECT * FROM proforma_detalles WHERE proforma_id = ?', [id]);
    res.json({ ...proformaRows[0], lineas: detalles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la proforma' });
  }
};

const updateEstadoProforma = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['ENVIADA', 'VISTA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${estadosValidos.join(', ')}` });
    }
    const [result] = await pool.query('UPDATE proformas SET estado = ? WHERE id = ?', [estado, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Proforma no encontrada' });
    res.json({ mensaje: 'Estado de la proforma actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado de la proforma' });
  }
};

// Para el panel admin: trae proformas con nombre de marca y cliente ya resueltos (JOIN)
const getProformasParaPanel = async () => {
  const [rows] = await pool.query(`
    SELECT
      p.id, p.numero_correlativo, p.fecha_emision, p.fecha_vencimiento,
      p.total, p.estado,
      m.nombre AS marca_nombre,
      c.nombre_razon_social AS cliente_nombre
    FROM proformas p
    JOIN marcas m ON p.marca_id = m.id
    JOIN clientes c ON p.cliente_id = c.id
    ORDER BY p.creado_en DESC
  `);
  return rows;
};

module.exports = { createProforma, getProformas, getProformaById, updateEstadoProforma, getProformasParaPanel };