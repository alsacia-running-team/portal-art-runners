import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const RECOVERY_COOKIE = 'alsacia_password_recovery'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const hasRecoveryCookie = cookieStore.get(RECOVERY_COOKIE)?.value === 'pending'

    if (!hasRecoveryCookie) {
      return NextResponse.json(
        { error: 'El enlace de recuperación no es válido o ya fue usado.' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'El enlace de recuperación no es válido o expiró.' },
        { status: 401 }
      )
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña: ' + updateError.message },
        { status: 400 }
      )
    }

    await supabase.auth.signOut()

    const response = NextResponse.json({ success: true })
    response.cookies.delete(RECOVERY_COOKIE)

    return response
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
