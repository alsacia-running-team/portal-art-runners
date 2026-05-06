import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function generateReference() {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `ART-${timestamp}-${random}`
}

export async function POST() {
  try {
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET

    if (!integritySecret) {
      return NextResponse.json(
        { error: 'Integrity secret not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const admin = createAdminClient()
    const { data: user, error: userError } = await admin
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (user.is_courtesy || user.account_status !== 'approved' || !user.plan_id) {
      return NextResponse.json(
        { error: 'User is not eligible for payments' },
        { status: 403 }
      )
    }

    const { data: plan, error: planError } = await admin
      .from('plans')
      .select('*')
      .eq('id', user.plan_id)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    const reference = generateReference()
    const amountInCents = (user.custom_price_cop ?? plan.price_cop) * 100
    const currency = 'COP'

    const { data: intent, error: intentError } = await admin
      .from('payment_intents')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        reference,
        amount_in_cents: amountInCents,
        currency,
      })
      .select('id')
      .single()

    if (intentError || !intent) {
      return NextResponse.json(
        { error: 'Could not create payment intent' },
        { status: 500 }
      )
    }

    // La firma es un SHA256 de: referencia + monto + moneda + secreto
    const stringToHash = `${reference}${amountInCents}${currency}${integritySecret}`
    const hash = crypto
      .createHash('sha256')
      .update(stringToHash)
      .digest('hex')

    return NextResponse.json({
      signature: hash,
      reference,
      amountInCents,
      currency,
      paymentIntentId: intent.id,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error generating signature' },
      { status: 500 }
    )
  }
}
