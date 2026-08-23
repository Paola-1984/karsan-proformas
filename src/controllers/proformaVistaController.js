const pool = require('../config/database');

const formatMoney = (valor) => `$${Number(valor).toFixed(2)}`;

const formatFecha = (fecha) => {
  const d = new Date(fecha);
  return d.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Construye un enlace de WhatsApp a partir del número guardado (limpia todo lo que no sea dígito)
const construirLinkWhatsapp = (numero) => {
  const soloDigitos = numero.replace(/\D/g, '');
  return `https://wa.me/${soloDigitos}`;
};

  const renderContacto = (marca) => {
  const items = [];
  if (marca.direccion) {
    items.push(`<span class="contacto-link">📍 ${marca.direccion}</span>`);
  }
  if (marca.correo_remitente) {
    items.push(`<a href="mailto:${marca.correo_remitente}" class="contacto-link">✉️ ${marca.correo_remitente}</a>`);
  }
  if (marca.telefono) {
    items.push(`<a href="tel:${marca.telefono}" class="contacto-link">📞 ${marca.telefono}</a>`);
  }
  if (marca.whatsapp) {
    items.push(`<a href="${construirLinkWhatsapp(marca.whatsapp)}" target="_blank" rel="noopener" class="contacto-link">💬 WhatsApp</a>`);
  }
  if (marca.sitio_web) {
    items.push(`<a href="https://${marca.sitio_web.replace(/^https?:\/\//, '')}" target="_blank" rel="noopener" class="contacto-link">🌐 ${marca.sitio_web}</a>`);
  }
  return items.length > 0 ? items.join('') : '<span class="contacto-pendiente">Datos de contacto próximamente</span>';
};

const renderRedesSociales = (marca) => {
  const redes = [
    { url: marca.facebook_url, nombre: 'Facebook' },
    { url: marca.instagram_url, nombre: 'Instagram' },
    { url: marca.tiktok_url, nombre: 'TikTok' },
    { url: marca.linkedin_url, nombre: 'LinkedIn' }
  ].filter(r => r.url);

  if (redes.length === 0) return '';
  return `<div class="redes-sociales">${redes.map(r => `<a href="${r.url}" target="_blank" rel="noopener">${r.nombre}</a>`).join(' &middot; ')}</div>`;
};

const renderPortafolio = (items) => {
  if (!items || items.length === 0) return '';
  return `
    <section class="seccion-portafolio">
      <h2>Nuestro trabajo</h2>
      <div class="portafolio-grid">
        ${items.map(item => `
          <div class="portafolio-item">
            ${item.titulo ? `<h3>${item.titulo}</h3>` : ''}
            ${item.descripcion ? `<p>${item.descripcion}</p>` : ''}
            ${item.iframe_embed}
          </div>
        `).join('')}
      </div>
    </section>
  `;
};

const renderLineas = (lineas) => {
  return lineas.map(l => {
    const ivaMonto = Number(l.subtotal_linea) * (Number(l.iva_porcentaje) / 100);
    const totalLinea = Number(l.subtotal_linea) + ivaMonto;
    return `
      <tr>
        <td>${l.descripcion_custom}</td>
        <td class="centrado">${l.cantidad}</td>
        <td class="derecha">${formatMoney(l.precio_unitario)}</td>
        <td class="derecha">${formatMoney(totalLinea)}</td>
      </tr>
    `;
  }).join('');
};

const renderBotonesAccion = (numeroCorrelativo, estado) => {
  if (estado === 'ACEPTADA') {
    return `<div class="estado-final estado-aceptada">✅ Proforma aceptada</div>`;
  }
  if (estado === 'RECHAZADA') {
    return `<div class="estado-final estado-rechazada">❌ Proforma rechazada</div>`;
  }
  if (estado === 'VENCIDA') {
    return `<div class="estado-final estado-vencida">⏰ Esta proforma ha vencido. Contáctanos para una nueva cotización.</div>`;
  }
  return `
    <div class="botones-accion">
      <button onclick="responderProforma('ACEPTADA')" class="btn-aceptar">Aceptar proforma</button>
      <button onclick="responderProforma('RECHAZADA')" class="btn-rechazar">Rechazar</button>
    </div>
    <div id="mensaje-respuesta"></div>
    <script>
      async function responderProforma(estado) {
        if (!confirm(estado === 'ACEPTADA' ? '¿Confirmas que aceptas esta proforma?' : '¿Confirmas que deseas rechazar esta proforma?')) return;
        try {
          const res = await fetch(window.location.pathname + '/estado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
          });
          const data = await res.json();
          if (res.ok) {
            window.location.reload();
          } else {
            document.getElementById('mensaje-respuesta').innerText = data.error || 'No se pudo procesar tu respuesta';
          }
        } catch (err) {
          document.getElementById('mensaje-respuesta').innerText = 'Error de conexión, intenta de nuevo';
        }
      }
    </script>
  `;
};

const construirHtmlProforma = (proforma, lineas, marca, cliente, portafolio) => {
  const tasasIva = [...new Set(lineas.map(l => Number(l.iva_porcentaje)))];
  const ivaLabel = tasasIva.length === 1 ? ` (${tasasIva[0]}%)` : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proforma ${proforma.numero_correlativo} - ${marca.nombre}</title>
<style>
  :root {
    --color-primario: ${marca.color_primario};
    --color-secundario: ${marca.color_secundario};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #f4f4f4; line-height: 1.5; }
  .contenedor { max-width: 800px; margin: 0 auto; background: #fff; }
  header { background: var(--color-primario); color: #fff; padding: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
  header img { max-height: 60px; }
  .numero-proforma { text-align: right; }
  .numero-proforma .numero { font-size: 1.4em; font-weight: bold; }
    .badge-estado { display: inline-block; padding: 4px 12px; border-radius: 12px; background: var(--color-secundario); color: #fff; font-size: 0.85em; font-weight: bold; margin-top: 5px; }
  main { padding: 30px; }
  .datos-cliente { display: flex; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
  .datos-cliente div { flex: 1; min-width: 200px; }
  .datos-cliente h3 { color: var(--color-primario); font-size: 0.9em; text-transform: uppercase; margin-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: var(--color-primario); color: #fff; padding: 10px; text-align: left; font-size: 0.9em; }
  td { padding: 10px; border-bottom: 1px solid #eee; }
  .centrado { text-align: center; }
  .derecha { text-align: right; }
  .totales { margin-left: auto; width: 280px; margin-top: 15px; }
  .totales div { display: flex; justify-content: space-between; padding: 6px 0; }
  .totales .total-final { font-weight: bold; font-size: 1.2em; border-top: 2px solid var(--color-primario); padding-top: 10px; margin-top: 5px; }
  .condiciones { margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid var(--color-secundario); font-size: 0.9em; }
  .seccion-portafolio { margin-top: 35px; }
  .seccion-portafolio h2 { color: var(--color-primario); margin-bottom: 15px; }
  .portafolio-item { margin-bottom: 20px; }
  .portafolio-item h3 { font-size: 1em; margin-bottom: 5px; }
  .botones-accion { display: flex; gap: 10px; margin: 25px 0; }
  .btn-aceptar, .btn-rechazar { flex: 1; padding: 14px; border: none; border-radius: 6px; font-size: 1em; font-weight: bold; cursor: pointer; }
  .btn-aceptar { background: #2e7d32; color: #fff; }
  .btn-rechazar { background: #c62828; color: #fff; }
  #mensaje-respuesta { color: #c62828; margin-top: 10px; font-size: 0.9em; }
  .estado-final { padding: 15px; border-radius: 6px; text-align: center; font-weight: bold; margin: 25px 0; }
  .estado-aceptada { background: #e8f5e9; color: #2e7d32; }
  .estado-rechazada { background: #ffebee; color: #c62828; }
  .estado-vencida { background: #fff3e0; color: #e65100; }
  footer { background: #f4f4f4; padding: 25px 30px; text-align: center; font-size: 0.9em; }
  .contacto-link { display: inline-block; margin: 5px 10px; color: var(--color-primario); text-decoration: none; }
  .contacto-pendiente { color: #999; font-style: italic; }
  .redes-sociales { margin-top: 10px; font-size: 0.85em; }
  .redes-sociales a { color: #666; text-decoration: none; }
  @media print {
    body { background: #fff; }
    @page { size: A4; margin: 15mm; }
    .botones-accion { display: none; }
  }
</style>
</head>
<body>
<div class="contenedor">
  <header>
    <div>
      ${marca.logo_url ? `<img src="${marca.logo_url}" alt="${marca.nombre}">` : `<h1>${marca.nombre}</h1>`}
    </div>
    <div class="numero-proforma">
      <div class="numero">${proforma.numero_correlativo}</div>
      <div>Emitida: ${formatFecha(proforma.fecha_emision)}</div>
      <div>Vence: ${formatFecha(proforma.fecha_vencimiento)}</div>
      <span class="badge-estado">${proforma.estado}</span>
    </div>
  </header>

  <main>
    <div class="datos-cliente">
      <div>
        <h3>Cliente</h3>
        <div>${cliente.nombre_razon_social}</div>
        <div>${cliente.identificacion}</div>
        ${cliente.email ? `<div>${cliente.email}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Servicio</th>
          <th class="centrado">Cant.</th>
          <th class="derecha">Precio unit.</th>
          <th class="derecha">Total (IVA incl.)</th>
        </tr>
      </thead>
      <tbody>
        ${renderLineas(lineas)}
      </tbody>
    </table>

    <div class="totales">
      <div><span>Subtotal</span><span>${formatMoney(proforma.subtotal)}</span></div>
      ${Number(proforma.descuento_general) > 0 ? `<div><span>Descuento general</span><span>-${formatMoney(proforma.descuento_general)}</span></div>` : ''}
      <div><span>IVA${ivaLabel}</span><span>${formatMoney(proforma.monto_iva)}</span></div>
      <div class="total-final"><span>Total</span><span>${formatMoney(proforma.total)}</span></div>
    </div>

    ${proforma.condiciones_pago ? `<div class="condiciones"><strong>Condiciones de pago:</strong> ${proforma.condiciones_pago}</div>` : ''}

    ${renderPortafolio(portafolio)}

    ${renderBotonesAccion(proforma.numero_correlativo, proforma.estado)}
  </main>

  <footer>
    <div>${renderContacto(marca)}</div>
    ${renderRedesSociales(marca)}
    <div style="margin-top: 15px; font-size: 0.8em; color: #999;">${marca.nombre}</div>
  </footer>
</div>
</body>
</html>
  `;
};

const verProforma = async (req, res) => {
  try {
    const { numero_correlativo } = req.params;

    const [proformaRows] = await pool.query('SELECT * FROM proformas WHERE numero_correlativo = ?', [numero_correlativo]);
    if (proformaRows.length === 0) {
      return res.status(404).send('<h1>Proforma no encontrada</h1>');
    }
    const proforma = proformaRows[0];

    // Marca automáticamente como VISTA la primera vez que se abre
    if (proforma.estado === 'ENVIADA') {
      await pool.query('UPDATE proformas SET estado = ? WHERE id = ?', ['VISTA', proforma.id]);
      proforma.estado = 'VISTA';
    }

    const [lineas] = await pool.query('SELECT * FROM proforma_detalles WHERE proforma_id = ?', [proforma.id]);
    const [marcaRows] = await pool.query('SELECT * FROM marcas WHERE id = ?', [proforma.marca_id]);
    const [clienteRows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [proforma.cliente_id]);
    const [portafolio] = await pool.query(
      'SELECT * FROM portafolio WHERE marca_id = ? AND activo = 1 ORDER BY orden ASC',
      [proforma.marca_id]
    );

    const html = construirHtmlProforma(proforma, lineas, marcaRows[0], clienteRows[0], portafolio);
    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send('<h1>Error al cargar la proforma</h1>');
  }
};

const actualizarEstadoPublico = async (req, res) => {
  try {
    const { numero_correlativo } = req.params;
    const { estado } = req.body;

    if (!['ACEPTADA', 'RECHAZADA'].includes(estado)) {
      return res.status(400).json({ error: 'estado debe ser ACEPTADA o RECHAZADA' });
    }

    const [rows] = await pool.query('SELECT id, estado FROM proformas WHERE numero_correlativo = ?', [numero_correlativo]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proforma no encontrada' });
    }

    const proforma = rows[0];
    if (!['ENVIADA', 'VISTA'].includes(proforma.estado)) {
      return res.status(409).json({ error: `Esta proforma ya fue marcada como ${proforma.estado} anteriormente` });
    }

    await pool.query('UPDATE proformas SET estado = ? WHERE id = ?', [estado, proforma.id]);
    res.json({ mensaje: `Proforma marcada como ${estado}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

module.exports = { verProforma, actualizarEstadoPublico };