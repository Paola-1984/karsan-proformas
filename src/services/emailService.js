const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Envía el correo de notificación de una proforma recién creada
const enviarCorreoProforma = async ({ marca, cliente, proforma }) => {
  const linkProforma = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/proforma/${proforma.numero_correlativo}`;

  const mailOptions = {
    from: `"${marca.nombre}" <${process.env.EMAIL_USER}>`,
    replyTo: marca.correo_remitente || process.env.EMAIL_USER,
    to: cliente.email,
    subject: `Proforma ${proforma.numero_correlativo} - ${marca.nombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${marca.color_primario};">Hola, ${cliente.nombre_razon_social}</h2>
        <p>Te compartimos tu proforma <strong>${proforma.numero_correlativo}</strong> de ${marca.nombre}.</p>
        <p style="font-size: 1.2em; font-weight: bold;">Total: $${Number(proforma.total).toFixed(2)}</p>
        <a href="${linkProforma}" 
           style="display: inline-block; background: ${marca.color_primario}; color: #fff; padding: 14px 28px; 
                  text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">
          Ver mi proforma
        </a>
        <p style="margin-top: 25px; font-size: 0.85em; color: #888;">
          Si el botón no funciona, copia y pega este link en tu navegador:<br>
          ${linkProforma}
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado:', info.messageId);
    return { exito: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return { exito: false, error: error.message };
  }
};

module.exports = { enviarCorreoProforma };