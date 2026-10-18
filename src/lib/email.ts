// Envío de correos transaccionales vía Resend. Solo se usa desde el servidor.

const RESEND_EMAILS_URL = 'https://api.resend.com/emails'
// Debe usar un dominio verificado en la misma cuenta de Resend que RESEND_API_KEY
// (onboarding@resend.dev solo entrega al dueño de la cuenta). RESEND_FROM_EMAIL lo sobrescribe.
const DEFAULT_FROM_EMAIL = 'Alsacia Running Team <no-reply@artrunners.co>'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function appUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${path}`
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  // Versión en texto plano: algunos clientes (y vistas previas) solo muestran esto.
  text?: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY no está configurada en el entorno del servidor')
  }

  const response = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      to,
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error('Error al enviar el correo: ' + errorData)
  }
}

function layout(content: string, footer = 'Si tienes alguna duda, comunícate con tu entrenador.') {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      ${content}
      <p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
        ${footer}
        <br/>Alsacia Running Team
      </p>
    </div>
  `
}

function button(href: string, label: string) {
  return `
    <div style="margin: 24px 0;">
      <a href="${href}"
         style="background-color: #171717; color: #fff; padding: 12px 24px;
                border-radius: 8px; text-decoration: none; font-size: 14px;
                font-weight: 500; display: inline-block;">
        ${label}
      </a>
    </div>
  `
}

export async function sendApprovalEmail(email: string, firstName: string, password: string) {
  const safeName = escapeHtml(firstName)
  const safeEmail = escapeHtml(email)
  const loginUrl = appUrl('/login')

  await sendEmail({
    to: email,
    subject: 'Tu cuenta fue aprobada: aquí está tu contraseña - Alsacia Running Team',
    html: layout(`
      <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 8px;">
        ¡Bienvenido(a) al equipo, ${safeName}!
      </h1>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Tu solicitud para unirte a <strong>Alsacia Running Team</strong> fue aprobada.
        Ya puedes ingresar al portal de miembros, donde verás tu plan, tus pagos y tu perfil.
      </p>
      <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
        Para ingresar usa estos datos:
      </p>
      <div style="background:#f4f4f5; border-radius:8px; padding:16px; margin:0 0 16px;">
        <p style="color:#555; font-size:14px; margin:0 0 4px;">Usuario (tu correo):</p>
        <p style="color:#1a1a1a; font-size:15px; margin:0 0 14px;"><strong>${safeEmail}</strong></p>
        <p style="color:#555; font-size:14px; margin:0 0 4px;">Contraseña:</p>
        <p style="color:#1a1a1a; font-family:monospace; font-size:20px; letter-spacing:2px; margin:0;">
          <strong>${password}</strong>
        </p>
      </div>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        <strong>Cómo ingresar:</strong><br/>
        1. Haz clic en <strong>Ingresar al portal</strong>.<br/>
        2. Escribe tu correo y la contraseña de arriba, tal como aparece (distingue mayúsculas y minúsculas).<br/>
        3. Si quieres cambiarla, usa la opción <strong>¿Olvidaste tu contraseña?</strong> en la página de ingreso.
      </p>
      ${button(loginUrl, 'Ingresar al portal')}
      <p style="color: #999; font-size: 13px; line-height: 1.6;">
        No compartas esta contraseña con nadie.
      </p>
    `),
    text: [
      `¡Bienvenido(a) al equipo, ${firstName}!`,
      '',
      'Tu solicitud para unirte a Alsacia Running Team fue aprobada. Ya puedes ingresar al portal de miembros.',
      '',
      'Para ingresar usa estos datos:',
      `Usuario (tu correo): ${email}`,
      `Contraseña: ${password}`,
      '',
      `Ingresa aquí: ${loginUrl}`,
      'Escribe la contraseña tal como aparece (distingue mayúsculas y minúsculas).',
      'Si quieres cambiarla, usa la opción "¿Olvidaste tu contraseña?" en la página de ingreso.',
      '',
      'No compartas esta contraseña con nadie.',
      'Alsacia Running Team',
    ].join('\n'),
  })
}

export async function sendRegistrationReceivedEmail(email: string, firstName: string, planLabel: string) {
  await sendEmail({
    to: email,
    subject: 'Recibimos tu solicitud - Alsacia Running Team',
    html: layout(`
      <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 8px;">
        ¡Hola, ${escapeHtml(firstName)}!
      </h1>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Recibimos tu solicitud para unirte a <strong>Alsacia Running Team</strong>
        en el plan <strong>${escapeHtml(planLabel)}</strong>.
      </p>
      <div style="background:#f4f4f5; border-radius:8px; padding:16px; margin:16px 0;">
        <p style="color:#555; font-size:14px; margin:0 0 6px;"><strong>¿Qué sigue?</strong></p>
        <p style="color:#555; font-size:14px; line-height:1.6; margin:0;">
          El entrenador revisará tu solicitud. Cuando sea aprobada te llegará otro correo
          con tu contraseña para ingresar al portal.
        </p>
      </div>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        No necesitas hacer nada más por ahora.
      </p>
    `),
  })
}

export async function sendNewRegistrationAdminEmail(
  to: string[],
  applicant: { firstName: string; lastName: string; email: string; phone: string; planLabel: string }
) {
  const fullName = `${applicant.firstName} ${applicant.lastName}`

  await sendEmail({
    to,
    subject: `Nueva solicitud: ${fullName} - Alsacia Running Team`,
    html: layout(`
      <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 8px;">
        Nueva solicitud de registro
      </h1>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        <strong>${escapeHtml(fullName)}</strong> quiere unirse al equipo.
      </p>
      <div style="background:#f4f4f5; border-radius:8px; padding:16px; margin:16px 0;">
        <p style="color:#555; font-size:14px; margin:0 0 6px;"><strong>Correo:</strong> ${escapeHtml(applicant.email)}</p>
        <p style="color:#555; font-size:14px; margin:0 0 6px;"><strong>Teléfono:</strong> ${escapeHtml(applicant.phone)}</p>
        <p style="color:#555; font-size:14px; margin:0;"><strong>Plan de interés:</strong> ${escapeHtml(applicant.planLabel)}</p>
      </div>
      ${button(appUrl('/admin/solicitudes'), 'Revisar solicitud')}
    `, 'Aviso automático del portal.'),
  })
}
