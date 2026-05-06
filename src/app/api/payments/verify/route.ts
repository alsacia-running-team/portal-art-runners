import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPaymentIntentByReference } from '@/lib/payments/processing'
import { getWompiTransaction } from '@/lib/payments/wompi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get('id')
    const reference = request.nextUrl.searchParams.get('reference')

    if (!transactionId && !reference) {
      return NextResponse.json(
        { error: 'id or reference is required' },
        { status: 400 }
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

    const transaction = await getWompiTransaction({ transactionId, reference })

    if (!transaction) {
      return NextResponse.json({ status: 'NOT_FOUND' })
    }

    const intent = await findPaymentIntentByReference(transaction.reference)

    if (!intent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      )
    }

    const admin = createAdminClient()
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

    if (userError || !user || intent.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Payment does not belong to current user' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      status: transaction.status,
      transactionId: transaction.id,
      amount: transaction.amount_in_cents / 100,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
