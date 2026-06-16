'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { User, Plan } from '@/types/database'


declare global {
  interface Window {
    WidgetCheckout: new (config: Record<string, unknown>) => {
      open: (callback: (result: { transaction: { id: string; status: string } }) => void) => void
    }
  }
}

const PAYMENT_POLL_INTERVAL_MS = 4000
const PAYMENT_POLL_MAX_ATTEMPTS = 30
const PENDING_PAYMENT_STATUSES = new Set(['PENDING'])

export default function PagarPage() {
  const [user, setUser] = useState<User | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'failed' | 'pending' | null
    transactionId: string | null
    nextPaymentDate: string | null
  }>({ status: null, transactionId: null, nextPaymentDate: null })
  const supabase = createClient()

  function loadWompiScript() {
    if (document.querySelector('script[src="https://checkout.wompi.co/widget.js"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.wompi.co/widget.js'
    script.async = true
    document.head.appendChild(script)
  }

  async function loadUserData() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (userData) {
      setUser(userData)
      if (userData.plan_id) {
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('id', userData.plan_id)
          .single()
        if (planData) setPlan(planData)
      }
    }
    setLoading(false)
  }

  function getEffectivePrice() {
    return user?.custom_price_cop ?? plan?.price_cop ?? 0
  }

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  async function confirmPayment({
    transactionId,
    reference,
    pollUntilFinal = false,
  }: {
    transactionId?: string | null
    reference?: string | null
    pollUntilFinal?: boolean
  }) {
    setProcessing(true)

    for (let attempt = 0; attempt < PAYMENT_POLL_MAX_ATTEMPTS; attempt += 1) {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, reference }),
      })
      const data = await response.json()

      if (response.ok && data.status === 'APPROVED') {
        setPaymentResult({
          status: 'success',
          transactionId: data.transactionId,
          nextPaymentDate: data.nextPaymentDate,
        })
        await loadUserData()
        setProcessing(false)
        window.history.replaceState({}, '', '/miembro/pagar')
        return
      }

      if (response.ok && PENDING_PAYMENT_STATUSES.has(data.status)) {
        setPaymentResult({
          status: 'pending',
          transactionId: data.transactionId,
          nextPaymentDate: null,
        })

        if (pollUntilFinal) {
          await wait(PAYMENT_POLL_INTERVAL_MS)
          continue
        }

        break
      }

      if (response.ok && data.status === 'NOT_FOUND' && pollUntilFinal) {
        await wait(PAYMENT_POLL_INTERVAL_MS)
        continue
      }

      if (data.status && data.status !== 'NOT_FOUND') {
        setPaymentResult({
          status: 'failed',
          transactionId: data.transactionId,
          nextPaymentDate: null,
        })
      } else if (data.error) {
        setPaymentResult({ status: 'failed', transactionId: transactionId ?? null, nextPaymentDate: null })
      }

      break
    }

    setProcessing(false)
    window.history.replaceState({}, '', '/miembro/pagar')
  }

  useEffect(() => {
    void (async () => {
      await loadUserData()
    })()
    loadWompiScript()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const transactionId = params.get('id')
    const pendingRef = params.get('ref')
    if ((transactionId || pendingRef) && user) {
      void (async () => {
        await confirmPayment({
          transactionId,
          reference: pendingRef,
          pollUntilFinal: true,
        })
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handlePay() {
    if (!user || !plan) return
    if (!window.WidgetCheckout) {
      alert('El sistema de pagos está cargando. Intenta de nuevo en unos segundos.')
      return
    }

    setProcessing(true)

    const signatureResponse = await fetch('/api/payments/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const {
      signature,
      reference,
      amountInCents,
      currency,
      error: sigError,
    } = await signatureResponse.json()

    if (sigError || !signature || !reference || !amountInCents || !currency) {
      alert('Error al preparar el pago. Intenta de nuevo.')
      setProcessing(false)
      return
    }

    const checkout = new window.WidgetCheckout({
      currency,
      amountInCents,
      reference,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      'signature:integrity': signature,
      redirectUrl: `${window.location.origin}/miembro/pagar?ref=${reference}`,
      customerData: {
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        phoneNumber: user.phone,
        phoneNumberPrefix: '+57',
        legalId: user.identification,
        legalIdType: 'CC',
      },
    })

    checkout.open(async (result) => {
      const transaction = result.transaction

      if (transaction.status === 'APPROVED') {
        await confirmPayment({ transactionId: transaction.id })
      } else if (transaction.status === 'PENDING') {
        await confirmPayment({
          transactionId: transaction.id,
          pollUntilFinal: true,
        })
      } else {
        setPaymentResult({ status: 'failed', transactionId: transaction.id, nextPaymentDate: null })
      }

      setProcessing(false)
    })
  }

  function getPaymentStatus(): { label: string; isAlDia: boolean } {
    if (!user) return { label: 'Sin datos', isAlDia: false }
    if (user.is_courtesy) return { label: 'Al día (cortesía)', isAlDia: true }
    if (!user.next_payment_date) return { label: 'Pendiente', isAlDia: false }
    const today = new Date()
    const nextPayment = new Date(user.next_payment_date)
    if (today > nextPayment) return { label: 'Pendiente', isAlDia: false }
    return { label: 'Al día', isAlDia: true }
  }

  function formatPrice(amount: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'No registrada'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Cargando información de pago...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Realizar pago</h1>
        <Card className="max-w-lg border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-alsacia-yellow-50 mb-4">
                <svg className="w-7 h-7 text-alsacia-yellow-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-gray-600">
                Aún no tienes un plan asignado. Contacta al administrador para que te
                asigne un plan de entrenamiento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user?.is_courtesy) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Realizar pago</h1>
        <Card className="max-w-lg border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-alsacia-cyan-50 mb-4">
                <svg className="w-7 h-7 text-alsacia-cyan-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">
                Tu cuenta está marcada como cortesía. No necesitas realizar pagos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user && !user.identification) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Realizar pago</h1>
        <Card className="max-w-lg border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-alsacia-yellow-50 mb-4">
                <svg className="w-7 h-7 text-alsacia-yellow-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-6">
                Para realizar pagos necesitas registrar tu número de identificación.
                Complétalo en tus datos personales.
              </p>
              <Link href="/miembro/editar">
                <Button className="h-11 px-6 bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold">
                  Completar identificación
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const paymentStatus = getPaymentStatus()
  const effectivePrice = getEffectivePrice()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Realizar pago</h1>
        <p className="text-gray-500 mt-1">Paga tu plan de entrenamiento de forma segura</p>
      </div>

      {/* Resultado del pago */}
      {paymentResult.status && (
        <Card className={`max-w-lg mb-6 border-0 shadow-sm ${
          paymentResult.status === 'success'
            ? 'bg-gradient-to-r from-alsacia-cyan-50 to-alsacia-cyan-100'
            : paymentResult.status === 'pending'
            ? 'bg-gradient-to-r from-alsacia-yellow-50 to-alsacia-yellow-100'
            : 'bg-gradient-to-r from-alsacia-pink-50 to-alsacia-pink-100'
        }`}>
          <CardContent className="pt-6 text-center">
            {paymentResult.status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-alsacia-cyan-200 mb-4">
                  <svg className="w-7 h-7 text-alsacia-cyan-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-alsacia-blue-800 text-lg font-semibold mb-2">
                  ¡Pago realizado con éxito!
                </p>
                <p className="text-alsacia-blue-600 text-sm">
                  ID: {paymentResult.transactionId}
                </p>
                <p className="text-alsacia-blue-600 text-sm mt-1">
                  Próximo pago: {formatDate(paymentResult.nextPaymentDate)}
                </p>
              </>
            )}
            {paymentResult.status === 'pending' && (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-alsacia-yellow-200 mb-4">
                  <svg className="w-7 h-7 text-alsacia-yellow-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-alsacia-yellow-800 text-lg font-semibold mb-2">
                  Pago en proceso
                </p>
                <p className="text-alsacia-yellow-700 text-sm">
                  Tu pago está siendo procesado. Puede tomar unos minutos.
                </p>
              </>
            )}
            {paymentResult.status === 'failed' && (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-alsacia-pink-200 mb-4">
                  <svg className="w-7 h-7 text-alsacia-pink-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-alsacia-pink-800 text-lg font-semibold mb-2">
                  Pago no completado
                </p>
                <p className="text-alsacia-pink-700 text-sm">
                  Hubo un problema con tu pago. Intenta de nuevo o usa otro método.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen del pago */}
      <Card className="max-w-lg border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-alsacia-blue-500">Resumen</CardTitle>
          <CardDescription>Revisa los datos antes de pagar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Plan</span>
            <span className="text-sm font-medium text-gray-900">{plan.name} ({plan.frequency})</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Valor a pagar</span>
            <span className="text-xl font-bold text-alsacia-blue-700">{formatPrice(effectivePrice)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Estado de pago</span>
            <Badge className={`${
              paymentStatus.isAlDia
                ? 'bg-alsacia-cyan-500 hover:bg-alsacia-cyan-500 text-white'
                : 'bg-alsacia-pink-500 hover:bg-alsacia-pink-500 text-white'
            }`}>
              {paymentStatus.label}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-gray-500">Próximo pago</span>
            <span className="text-sm font-medium text-gray-900">{formatDate(user?.next_payment_date ?? null)}</span>
          </div>

          <div className="pt-4">
            <Button
              className="w-full h-12 bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold text-base"
              size="lg"
              onClick={handlePay}
              disabled={processing}
            >
              {processing ? 'Procesando...' : `Pagar ${formatPrice(effectivePrice)}`}
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center pt-3">
            Pago procesado de forma segura por Wompi.
            Puedes pagar con tarjeta, PSE, Nequi y más.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
