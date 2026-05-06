import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWompiTransaction } from '@/lib/payments/wompi'
import {
  completeApprovedPayment,
  findPaymentIntentByReference,
  markPaymentIntentStatus,
  validateTransactionMatchesIntent,
} from '@/lib/payments/processing'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { transactionId, reference } = await request.json()

    if (!transactionId && !reference) {
      return NextResponse.json(
        { error: 'transactionId or reference is required' },
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

    const matchesIntent = await validateTransactionMatchesIntent({ intent, transaction })

    if (!matchesIntent) {
      return NextResponse.json(
        { error: 'Transaction does not match payment intent' },
        { status: 409 }
      )
    }

    if (transaction.status !== 'APPROVED') {
      await markPaymentIntentStatus({
        intentId: intent.id,
        transactionId: transaction.id,
        status: transaction.status,
      })

      return NextResponse.json({
        status: transaction.status,
        transactionId: transaction.id,
      })
    }

    const completed = await completeApprovedPayment({ intent, transaction })

    return NextResponse.json({
      status: completed.status,
      transactionId: completed.transactionId,
      nextPaymentDate: completed.nextPaymentDate,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
