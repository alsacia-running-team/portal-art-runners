import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { reference, amountInCents, currency } = await request.json()

    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET

    if (!integritySecret) {
      return NextResponse.json(
        { error: 'Integrity secret not configured' },
        { status: 500 }
      )
    }

    // La firma es un SHA256 de: referencia + monto + moneda + secreto
    const stringToHash = `${reference}${amountInCents}${currency}${integritySecret}`
    const hash = crypto
      .createHash('sha256')
      .update(stringToHash)
      .digest('hex')

    return NextResponse.json({ signature: hash })
  } catch {
    return NextResponse.json(
      { error: 'Error generating signature' },
      { status: 500 }
    )
  }
}