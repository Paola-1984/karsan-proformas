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
    const iconoWhatsapp = `<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-4px;margin-right:4px;" fill="#25D366"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.76.46 3.45 1.32 4.94L2 22l5.2-1.3A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.2 14.3c-.22.62-1.28 1.2-1.77 1.24-.45.04-.9.06-1.45-.09-.33-.09-.76-.24-1.31-.47-2.3-.99-3.8-3.3-3.92-3.46-.11-.15-.94-1.25-.94-2.38 0-1.13.6-1.68.81-1.91.21-.23.46-.29.61-.29.15 0 .3 0 .43.01.14.01.32-.05.5.38.19.46.64 1.58.7 1.69.06.11.1.24.02.39-.08.15-.12.24-.24.37-.12.13-.25.29-.36.39-.12.11-.24.23-.11.46.13.23.6 1 1.29 1.62.89.79 1.63 1.04 1.87 1.16.24.12.38.1.52-.06.15-.15.62-.72.79-.97.17-.25.34-.2.56-.12.23.08 1.45.68 1.7.8.25.12.41.18.47.29.06.1.06.6-.16 1.22z"/></svg>`;
    items.push(`<a href="${construirLinkWhatsapp(marca.whatsapp)}" target="_blank" rel="noopener" class="contacto-link">${iconoWhatsapp}WhatsApp</a>`);
  }
  if (marca.sitio_web) {
    items.push(`<a href="https://${marca.sitio_web.replace(/^https?:\/\//, '')}" target="_blank" rel="noopener" class="contacto-link">🌐 ${marca.sitio_web}</a>`);
  }
  return items.length > 0 ? items.join('') : '<span class="contacto-pendiente">Datos de contacto próximamente</span>';
};

const iconosRedes = {
  Facebook: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M22 12a10 10 0 10-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.57 1.53-3.99 3.87-3.99 1.12 0 2.3.2 2.3.2v2.53h-1.3c-1.28 0-1.68.8-1.68 1.62V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0022 12z"/></svg>`,
  Instagram: `<svg viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FEDA75"/><stop offset="30%" stop-color="#FA7E1E"/><stop offset="60%" stop-color="#D62976"/><stop offset="85%" stop-color="#962FBF"/><stop offset="100%" stop-color="#4F5BD5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#igGrad)"/><path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4z" fill="#fff"/><circle cx="17.4" cy="6.6" r="1.2" fill="#fff"/></svg>`,
  TikTok: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#000000"><path d="M16.5 2h-3v13.5a2.5 2.5 0 1 1-2.5-2.5c.19 0 .38.02.56.05V9.9a5.5 5.5 0 1 0 5.94 5.48c0-.08 0-.15 0-.23V8.4a7.9 7.9 0 0 0 4 1.1V6.4a4.9 4.9 0 0 1-4-3.4 4.9 4.9 0 0 1-1-1z"/></svg>`,
  LinkedIn: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.15 1.45-2.15 2.94v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`
};

const renderRedesSociales = (marca) => {
  const redes = [
    { url: marca.facebook_url, nombre: 'Facebook' },
    { url: marca.instagram_url, nombre: 'Instagram' },
    { url: marca.tiktok_url, nombre: 'TikTok' },
    { url: marca.linkedin_url, nombre: 'LinkedIn' }
  ].filter(r => r.url);

  if (redes.length === 0) return '';
  return `<div class="redes-sociales">${redes.map(r => `<a href="${r.url}" target="_blank" rel="noopener" aria-label="${r.nombre}" title="${r.nombre}" style="display:inline-flex;margin:0 6px;vertical-align:middle;">${iconosRedes[r.nombre]}</a>`).join('')}</div>`;
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --color-primario: ${marca.color_primario};
    --color-secundario: ${marca.color_secundario};
    --amarillo-acento: #F4DC00;
    --fondo: #F5F6F8;
    --texto: #1C2430;
    --texto-suave: #5B6472;
    --borde: #E4E7EC;
    --card-bg: #FFFFFF;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif; color: var(--texto); background: var(--fondo); line-height: 1.6; }
  .contenedor { max-width: 800px; margin: 0 auto; padding: 24px 16px 60px; }
  header {
    background: linear-gradient(135deg, var(--color-primario), #16233d);
    color: #fff; padding: 32px 30px; border-radius: 16px;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;
    box-shadow: 0 8px 24px rgba(36,65,114,0.18);
  }
  header img { max-height: 56px; }
  .numero-proforma { text-align: right; }
  .numero-proforma .numero { font-size: 1.5em; font-weight: 800; letter-spacing: 0.3px; }
  .numero-proforma div { font-size: 0.85em; opacity: 0.85; margin-top: 2px; }
  .badge-estado {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px 5px 10px; border-radius: 20px; background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.35);
    color: #fff; font-size: 0.8em; font-weight: 700; letter-spacing: 0.4px; margin-top: 8px;
  }
  .badge-estado::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--amarillo-acento); display: inline-block; }
  main { padding: 0; }
    .card {
    background: var(--card-bg); border: 1px solid var(--borde); border-radius: 14px;
    padding: 26px 28px; margin-top: 22px; box-shadow: 0 2px 10px rgba(36,65,114,0.05);
    animation: fadeInUp 0.5s ease backwards;
  }
  .card:nth-of-type(1) { animation-delay: 0.05s; }
  .card:nth-of-type(2) { animation-delay: 0.12s; }
  .card:nth-of-type(3) { animation-delay: 0.19s; }
  .card:nth-of-type(4) { animation-delay: 0.26s; }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .card { animation: none; }
  }
  .card h2 {
    font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.6px;
    color: var(--color-primario); font-weight: 700; margin-bottom: 14px;
  }
  .datos-cliente { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
  .datos-cliente div { flex: 1; min-width: 200px; }
  .datos-cliente .nombre-cliente { font-size: 1.1em; font-weight: 700; color: var(--texto); }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: var(--fondo); color: var(--texto-suave); padding: 10px 12px;
    text-align: left; font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700;
    border-bottom: 2px solid var(--borde);
  }
    td { padding: 12px; border-bottom: 1px solid var(--borde); font-size: 0.95em; }
  tr:last-child td { border-bottom: none; }
  tbody tr { transition: background 0.15s ease; }
  tbody tr:hover { background: var(--fondo); }
  .centrado { text-align: center; }
  .derecha { text-align: right; }
  .totales { margin-left: auto; width: 280px; margin-top: 18px; }
  .totales div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.95em; }
  .totales .total-final {
    font-weight: 800; font-size: 1.25em; color: var(--color-primario);
    border-top: none; border-left: 4px solid var(--amarillo-acento);
    padding: 10px 0 10px 12px; margin-top: 8px;
  }
  .condiciones { font-size: 0.9em; color: var(--texto-suave); }
  .seccion-portafolio h2 { margin-bottom: 15px; }
  .portafolio-item { margin-bottom: 20px; }
  .portafolio-item h3 { font-size: 1em; margin-bottom: 5px; font-weight: 700; }
  .botones-accion { display: flex; gap: 10px; margin-top: 22px; }
  .btn-aceptar, .btn-rechazar {
    flex: 1; padding: 14px; border: none; border-radius: 10px; font-size: 0.95em;
    font-weight: 700; cursor: pointer; font-family: inherit; transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .btn-aceptar { background: #2e7d32; color: #fff; }
  .btn-rechazar { background: #c62828; color: #fff; }
  .btn-aceptar:hover, .btn-rechazar:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  #mensaje-respuesta { color: #c62828; margin-top: 10px; font-size: 0.9em; }
  .estado-final { padding: 16px; border-radius: 10px; text-align: center; font-weight: 700; margin-top: 22px; }
  .estado-aceptada { background: #e8f5e9; color: #2e7d32; }
  .estado-rechazada { background: #ffebee; color: #c62828; }
  .estado-vencida { background: #fff3e0; color: #e65100; }
  footer { margin-top: 22px; padding: 28px 24px; text-align: center; font-size: 0.9em; color: var(--texto-suave); }
  .contacto-link { display: inline-block; margin: 5px 10px; color: var(--color-primario); text-decoration: none; font-weight: 600; }
  .contacto-pendiente { color: #999; font-style: italic; }
  .redes-sociales { margin-top: 10px; font-size: 0.85em; }
  .redes-sociales a { color: var(--texto-suave); text-decoration: none; }
    @media print {
    body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 10mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .botones-accion { display: none; }
    .contenedor { padding: 0; }
    .card { box-shadow: none; animation: none; opacity: 1; transform: none; break-inside: avoid; margin-top: 10px; padding: 14px 20px; }
    .card h2 { margin-bottom: 8px; }
    header { box-shadow: none; break-inside: avoid; padding: 16px 20px; }
    .totales { margin-top: 10px; }
    .estado-final { margin-top: 10px; padding: 10px; }
    footer { break-inside: avoid; margin-top: 10px; padding: 10px; }
    .no-imprimir { display: none; }
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
    <div class="card datos-cliente">
      <div>
        <h2>Cliente</h2>
        <div class="nombre-cliente">${cliente.nombre_razon_social}</div>
        <div>${cliente.identificacion}</div>
        ${cliente.email ? `<div>${cliente.email}</div>` : ''}
      </div>
    </div>

    <div class="card">
      <h2>Servicios cotizados</h2>
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

      ${proforma.condiciones_pago ? `<div class="condiciones" style="margin-top:16px;"><strong>Condiciones de pago:</strong> ${proforma.condiciones_pago}</div>` : ''}
    </div>

        ${portafolio && portafolio.length > 0 ? `<div class="card no-imprimir">${renderPortafolio(portafolio)}</div>` : ''}

    <div class="card">
      ${renderBotonesAccion(proforma.numero_correlativo, proforma.estado)}
    </div>
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