import config from '../config/index.js';
import { ErrorApp } from '../errores.js';

function escapeHtml(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function servicioConfigurado() {
  return Boolean(config.resendApiKey && config.emailFrom);
}

async function enviarResend({ to, subject, html, text, idempotencyKey }) {
  if (!servicioConfigurado()) {
    throw new ErrorApp(503, 'La recuperación por correo todavía no está configurada.');
  }

  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profeluna-api/1.0',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [to],
      subject,
      html,
      text
    })
  });

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new ErrorApp(502, datos?.message || 'No se pudo enviar el correo de recuperación.');
  }
}

export const emailService = {
  servicioConfigurado,

  async enviarCodigoRecuperacion({ estudiante, codigo, resetId }) {
    const nombre = `${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim() || 'estudiante';
    const nombreSeguro = escapeHtml(nombre);
    const codigoSeguro = escapeHtml(codigo);

    await enviarResend({
      to: estudiante.email,
      subject: 'Código para restablecer tu contraseña',
      idempotencyKey: `epja-password-reset-${resetId}`,
      text: [
        `Hola ${nombre}.`,
        '',
        'Recibimos un pedido para restablecer tu contraseña del aula EPJA.',
        `Tu código es: ${codigo}`,
        '',
        'El código vence en 10 minutos. Si no pediste este cambio, ignorá este correo.'
      ].join('\n'),
      html: `
        <p>Hola ${nombreSeguro}.</p>
        <p>Recibimos un pedido para restablecer tu contraseña del aula EPJA.</p>
        <p>Tu código es:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:4px">${codigoSeguro}</p>
        <p>El código vence en 10 minutos. Si no pediste este cambio, ignorá este correo.</p>
      `
    });
  }
};
