import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RESEND_EMAILS_URL = 'https://api.resend.com/emails'

// Sin caracteres ambiguos (0/O, 1/l/I) para evitar errores al copiar la clave.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function generatePassword(length = 12): string {
  let password = ''
  for (let i = 0; i < length; i += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  return password
}

async function sendApprovalEmail(email: string, firstName: string, password: string) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY no está configurada en el entorno del servidor')
  }

  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`

  const response = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
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
            por el administrador. Estas son tus credenciales para ingresar:
          </p>
          <div style="background:#f4f4f5; border-radius:8px; padding:16px; margin:16px 0;">
            <p style="color:#555; font-size:14px; margin:0 0 6px;">
              <strong>Correo:</strong> ${email}
            </p>
            <p style="color:#555; font-size:14px; margin:0;">
              <strong>Contraseña temporal:</strong>
              <span style="font-family:monospace; font-size:16px; letter-spacing:1px;">${password}</span>
            </p>
          </div>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Por seguridad, te recomendamos cambiar esta contraseña después de iniciar sesión
            desde la opción <strong>¿Olvidaste tu contraseña?</strong>.
          </p>
          <div style="margin: 24px 0;">
            <a href="${loginUrl}"
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
    throw new Error('Error al enviar el correo: ' + errorData)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    // Verifica que quien aprueba sea un administrador autenticado
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', authUser.id)
      .single()

    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const admin = createAdminClient()

    const { data: targetUser, error: targetError } = await admin
      .from('users')
      .select('id, email, first_name, auth_id, account_status')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const password = generatePassword()
    let authId = targetUser.auth_id

    // Crea la cuenta de autenticación solo si aún no existe
    if (!authId) {
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email: targetUser.email,
          password,
          email_confirm: true,
        })

      if (createError || !created.user) {
        return NextResponse.json(
          { error: 'No se pudo crear la cuenta de acceso: ' + (createError?.message ?? '') },
          { status: 500 }
        )
      }

      authId = created.user.id
    } else {
      // Ya tenía cuenta de acceso: solo reasigna la contraseña temporal
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(authId, {
        password,
      })
      if (updateAuthError) {
        return NextResponse.json(
          { error: 'No se pudo asignar la contraseña: ' + updateAuthError.message },
          { status: 500 }
        )
      }
    }

    const { error: updateError } = await admin
      .from('users')
      .update({
        auth_id: authId,
        account_status: 'approved',
        joined_at: new Date().toISOString().split('T')[0],
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: 'No se pudo aprobar la solicitud: ' + updateError.message },
        { status: 500 }
      )
    }

    await sendApprovalEmail(targetUser.email, targetUser.first_name, password)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
