import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RESEND_EMAILS_URL = 'https://api.resend.com/emails'

export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json()
    const resendApiKey = process.env.RESEND_API_KEY

    if (!email || !firstName) {
      return NextResponse.json(
        { error: 'Email y nombre son requeridos' },
        { status: 400 }
      )
    }

    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY no está configurada en el entorno del servidor' },
        { status: 500 }
      )
    }

    const response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Alsacia Running Team <onboarding@resend.dev>',
        to: email,
        subject: '¡Tu cuenta ha sido aprobada! - Alsacia Running Team',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 8px;">
              ¡Bienvenido(a) al equipo, ${firstName}!
            </h1>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Tu cuenta en el portal de <strong>Alsacia Running Team</strong> ha sido aprobada
              por el administrador.
            </p>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Ya puedes ingresar al portal con tu correo y la contraseña que creaste
              al momento del registro.
            </p>
            <div style="margin: 24px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login"
                 style="background-color: #171717; color: #fff; padding: 12px 24px;
                        border-radius: 8px; text-decoration: none; font-size: 14px;
                        font-weight: 500; display: inline-block;">
                Ingresar al portal
              </a>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
              Si tienes alguna duda, comunícate con tu entrenador.
              <br/>Alsacia Running Team
            </p>
          </div>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json(
        { error: 'Error al enviar el correo: ' + errorData },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
