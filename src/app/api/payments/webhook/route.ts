import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  completeApprovedPayment,
  findPaymentIntentByReference,
  markPaymentIntentStatus,
  validateTransactionMatchesIntent,
} from '@/lib/payments/processing'
import type { WompiTransaction } from '@/lib/payments/wompi'

export const dynamic = 'force-dynamic'

type WompiEvent = {
  event: string
  data: {
    transaction?: WompiTransaction
  }
  signature?: {
    properties?: string[]
    checksum?: string
  }
  timestamp?: number
}

function getNestedValue(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object' && key in value) {
      return (value as Record<string, unknown>)[key]
    }

    return undefined
  }, source)
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function validateWompiChecksum(event: WompiEvent, headerChecksum: string | null) {
  const eventSecret = process.env.WOMPI_EVENTS_SECRET
  const properties = event.signature?.properties
  const bodyChecksum = event.signature?.checksum

  if (!eventSecret || !properties?.length || !event.timestamp) {
    return false
  }

  const values = properties.map((property) => {
    const value = getNestedValue(event.data, property)
    return value == null ? '' : String(value)
  })

  const localChecksum = crypto
    .createHash('sha256')
    .update(`${values.join('')}${event.timestamp}${eventSecret}`)
    .digest('hex')

  const normalizedLocalChecksum = localChecksum.toLowerCase()

  return (
    (headerChecksum && safeCompare(normalizedLocalChecksum, headerChecksum.toLowerCase())) ||
    (bodyChecksum && safeCompare(normalizedLocalChecksum, bodyChecksum.toLowerCase()))
  )
}

export async function POST(request: NextRequest) {
  try {
    const event = (await request.json()) as WompiEvent
    const headerChecksum = request.headers.get('x-event-checksum')

    if (!validateWompiChecksum(event, headerChecksum)) {
      return NextResponse.json(
        { error: 'Invalid checksum' },
        { status: 401 }
      )
    }

    if (event.event !== 'transaction.updated' || !event.data.transaction) {
      return NextResponse.json({ received: true })
    }

    const transaction = event.data.transaction
    const intent = await findPaymentIntentByReference(transaction.reference)

    if (!intent) {
      return NextResponse.json({ received: true, ignored: 'intent_not_found' })
    }

    const matchesIntent = await validateTransactionMatchesIntent({ intent, transaction })

    if (!matchesIntent) {
      return NextResponse.json(
        { error: 'Transaction does not match payment intent' },
        { status: 409 }
      )
    }

    if (transaction.status === 'APPROVED') {
      await completeApprovedPayment({ intent, transaction })
    } else {
      await markPaymentIntentStatus({
        intentId: intent.id,
        transactionId: transaction.id,
        status: transaction.status,
      })
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
