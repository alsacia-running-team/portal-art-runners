const WOMPI_API_URL = 'https://production.wompi.co/v1'
const WOMPI_TIMEOUT_MS = 10000

export type WompiTransaction = {
  id: string
  reference: string
  status: string
  amount_in_cents: number
  currency: string
  payment_method_type?: string | null
}

async function fetchWompi(path: string) {
  const privateKey = process.env.WOMPI_PRIVATE_KEY

  if (!privateKey) {
    throw new Error('WOMPI_PRIVATE_KEY is not configured')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WOMPI_TIMEOUT_MS)

  try {
    const response = await fetch(`${WOMPI_API_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${privateKey}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error('Wompi transaction lookup failed')
    }

    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function getWompiTransaction({
  transactionId,
  reference,
}: {
  transactionId?: string | null
  reference?: string | null
}): Promise<WompiTransaction | null> {
  if (transactionId) {
    const wompiData = await fetchWompi(`/transactions/${encodeURIComponent(transactionId)}`)
    return wompiData.data ?? null
  }

  if (!reference) {
    return null
  }

  const wompiData = await fetchWompi(`/transactions?reference=${encodeURIComponent(reference)}`)
  return wompiData.data?.[0] ?? null
}
