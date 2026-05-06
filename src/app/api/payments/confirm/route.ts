import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type WompiTransaction = {
  id: string
  status: string
  amount_in_cents: number
  payment_method_type?: string | null
}

function calculateNextPaymentDate(currentNextPaymentDate: string | null, frequency: string): string {
  const now = new Date()
  const currentNext = currentNextPaymentDate ? new Date(currentNextPaymentDate) : null
  const baseDate = currentNext && currentNext > now ? currentNext : now
  const nextDate = new Date(baseDate)

  if (frequency === 'trimestral') {
    nextDate.setMonth(nextDate.getMonth() + 3)
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }

  return nextDate.toISOString().split('T')[0]
}

async function getWompiTransaction({
  transactionId,
  reference,
}: {
  transactionId?: string
  reference?: string
}): Promise<WompiTransaction | null> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY

  if (!privateKey) {
    throw new Error('WOMPI_PRIVATE_KEY is not configured')
  }

  const url = transactionId
    ? `https://production.wompi.co/v1/transactions/${transactionId}`
    : `https://production.wompi.co/v1/transactions?reference=${encodeURIComponent(reference!)}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${privateKey}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Wompi transaction lookup failed')
  }

  const wompiData = await response.json()
  const transaction = transactionId ? wompiData.data : wompiData.data?.[0]

  return transaction ?? null
}

export async function POST(request: NextRequest) {
  try {
    const { transactionId, reference } = await request.json()

    if (!transactionId && !reference) {
      return NextResponse.json(
        { error: 'transactionId or reference is required' },
        { status: 400 }
      )
    }

    const transaction = await getWompiTransaction({ transactionId, reference })

    if (!transaction) {
      return NextResponse.json({ status: 'NOT_FOUND' })
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

    const { data: user, error: userError } = await supabase
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

    if (!user.plan_id) {
      return NextResponse.json(
        { error: 'User does not have an assigned plan' },
        { status: 400 }
      )
    }

    const { data: plan, error: planError } = await supabase
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

    const effectivePrice = user.custom_price_cop ?? plan.price_cop
    const expectedAmountInCents = effectivePrice * 100

    if (transaction.amount_in_cents !== expectedAmountInCents) {
      return NextResponse.json(
        { error: 'Transaction amount does not match user plan' },
        { status: 409 }
      )
    }

    if (transaction.status !== 'APPROVED') {
      return NextResponse.json({
        status: transaction.status,
        transactionId: transaction.id,
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const nextPaymentDate = calculateNextPaymentDate(user.next_payment_date, plan.frequency)

    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from('payments')
      .select('id, period_end')
      .eq('wompi_transaction_id', transaction.id)
      .maybeSingle()

    if (existingPaymentError) {
      return NextResponse.json(
        { error: 'Could not validate existing payment' },
        { status: 500 }
      )
    }

    if (!existingPayment) {
      const { error: insertError } = await supabase.from('payments').insert({
        user_id: user.id,
        plan_id: plan.id,
        amount_cop: effectivePrice,
        status: 'completed',
        payment_method: transaction.payment_method_type?.toLowerCase() ?? 'wompi',
        wompi_transaction_id: transaction.id,
        period_start: today,
        period_end: nextPaymentDate,
        paid_at: new Date().toISOString(),
      })

      if (insertError) {
        return NextResponse.json(
          { error: 'Could not register payment' },
          { status: 500 }
        )
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          last_payment_date: today,
          next_payment_date: nextPaymentDate,
        })
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Could not update user payment dates' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      status: 'APPROVED',
      transactionId: transaction.id,
      nextPaymentDate: existingPayment?.period_end ?? nextPaymentDate,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
