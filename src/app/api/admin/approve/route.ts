import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { todayInBogota } from '@/lib/dates'
import { sendApprovalEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Sin caracteres ambiguos (0/O, 1/l/I) para evitar errores al copiar la clave.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function generatePassword(length = 12): string {
  let password = ''
  for (let i = 0; i < length; i += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  return password
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
      .select('id, email, first_name, auth_id, account_status, joined_at')
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

      // Vincula la cuenta de acceso de inmediato (la solicitud sigue pendiente) para que
      // un reintento tras un fallo del correo reasigne la clave en vez de duplicar la cuenta.
      const { error: linkError } = await admin
        .from('users')
        .update({ auth_id: authId })
        .eq('id', userId)

      if (linkError) {
        return NextResponse.json(
          { error: 'No se pudo vincular la cuenta de acceso: ' + linkError.message },
          { status: 500 }
        )
      }
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

    // La clave solo se entrega por correo: si el envío falla, la solicitud no se aprueba.
    try {
      await sendApprovalEmail(targetUser.email, targetUser.first_name, password)
    } catch (emailError) {
      console.error('approve: no se pudo enviar el correo de aprobación', emailError)
      return NextResponse.json(
        {
          error:
            `No se pudo enviar el correo a ${targetUser.email}, por lo que la cuenta no fue aprobada. ` +
            'Verifica la configuración de correo (dominio en Resend) e intenta de nuevo.',
        },
        { status: 502 }
      )
    }

    const { error: updateError } = await admin
      .from('users')
      .update({
        auth_id: authId,
        account_status: 'approved',
        // Al regenerar el acceso de un miembro existente se conserva su fecha de ingreso.
        joined_at: targetUser.joined_at ?? todayInBogota(),
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: 'No se pudo aprobar la solicitud: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
