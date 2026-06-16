import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GENDERS = ['masculino', 'femenino', 'otro']
const INTERESTED_PLANS = ['grupal', 'personalizado']
const TRAINING_LEVELS = ['A', 'B', 'C', 'D']
const TRAINING_GOALS = ['salud', 'peso', 'rendimiento', 'social']
const STRENGTH_TRAINING = ['no', 'gimnasio', 'casa']

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const first_name = String(body.first_name ?? '').trim()
    const last_name = String(body.last_name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const phone = String(body.phone ?? '').trim()
    const gender = String(body.gender ?? '').trim()
    const birth_date = String(body.birth_date ?? '').trim()
    const interested_plan = String(body.interested_plan ?? '').trim()
    const training_level = String(body.training_level ?? '').trim()
    const training_goal = String(body.training_goal ?? '').trim()
    const strength_training = String(body.strength_training ?? '').trim()
    const lives_in_alsacia_raw = String(body.lives_in_alsacia ?? '').trim()

    // Validaciones de campos obligatorios
    if (
      !isNonEmptyString(first_name) ||
      !isNonEmptyString(last_name) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(phone) ||
      !isNonEmptyString(birth_date)
    ) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios.' },
        { status: 400 }
      )
    }

    if (!GENDERS.includes(gender)) {
      return NextResponse.json({ error: 'Género inválido.' }, { status: 400 })
    }
    if (!INTERESTED_PLANS.includes(interested_plan)) {
      return NextResponse.json({ error: 'Plan de interés inválido.' }, { status: 400 })
    }
    if (lives_in_alsacia_raw !== 'true' && lives_in_alsacia_raw !== 'false') {
      return NextResponse.json({ error: 'Respuesta de ubicación inválida.' }, { status: 400 })
    }
    if (!TRAINING_LEVELS.includes(training_level)) {
      return NextResponse.json({ error: 'Nivel de entrenamiento inválido.' }, { status: 400 })
    }
    if (!TRAINING_GOALS.includes(training_goal)) {
      return NextResponse.json({ error: 'Objetivo de entrenamiento inválido.' }, { status: 400 })
    }
    if (!STRENGTH_TRAINING.includes(strength_training)) {
      return NextResponse.json({ error: 'Respuesta de fuerza inválida.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Evita duplicados de correo con un mensaje claro
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado.' },
        { status: 409 }
      )
    }

    const { error: insertError } = await admin.from('users').insert({
      email,
      first_name,
      last_name,
      phone,
      gender,
      birth_date,
      role: 'member',
      account_status: 'pending',
      is_courtesy: false,
      interested_plan,
      lives_in_alsacia: lives_in_alsacia_raw === 'true',
      training_level,
      training_goal,
      strength_training,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Este correo ya está registrado.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'No se pudo guardar tu solicitud. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
