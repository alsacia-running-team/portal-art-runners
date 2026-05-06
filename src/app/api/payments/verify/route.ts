import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      )
    }

    // Consultar la transacción en Wompi por referencia
    const wompiResponse = await fetch(
      `https://production.wompi.co/v1/transactions?reference=${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        },
      }
    )

    if (!wompiResponse.ok) {
      return NextResponse.json(
        { error: 'Error al consultar Wompi' },
        { status: 500 }
      )
    }

    const wompiData = await wompiResponse.json()

    if (!wompiData.data || wompiData.data.length === 0) {
      return NextResponse.json({ status: 'NOT_FOUND' })
    }

    // Tomar la transacción más reciente con esa referencia
    const transaction = wompiData.data[0]

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