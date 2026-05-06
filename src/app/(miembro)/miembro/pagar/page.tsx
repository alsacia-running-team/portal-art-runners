'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { User, Plan } from '@/types/database'
import { useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    WidgetCheckout: new (config: Record<string, unknown>) => {
      open: (callback: (result: { transaction: { id: string; status: string } }) => void) => void
    }
  }
}

export default function PagarPage() {
  const [user, setUser] = useState<User | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'failed' | 'pending' | null
    transactionId: string | null
  }>({ status: null, transactionId: null })
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadUserData()
    loadWompiScript()
  }, [])

    // Verificar pago pendiente al volver de PSE
  useEffect(() => {
    const pendingRef = searchParams.get('ref')
    if (pendingRef && user) {
      verifyPendingPayment(pendingRef)
    }
  }, [searchParams, user])

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

  function generateReference() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `ART-${timestamp}-${random}`
  }

  function calculateNextPaymentDate(): string {
    // Si ya tiene próximo pago y está al día, extender desde esa fecha
    // Si está pendiente o no tiene fecha, calcular desde hoy
    const now = new Date()
    let baseDate: Date

    if (user?.next_payment_date) {
      const currentNext = new Date(user.next_payment_date)
      // Si está al día (next_payment_date es futuro), extender desde ahí
      // Si está pendiente (next_payment_date ya pasó), calcular desde hoy
      baseDate = currentNext > now ? currentNext : now
    } else {
      baseDate = now
    }

    const nextDate = new Date(baseDate)
    if (plan?.frequency === 'trimestral') {
      nextDate.setMonth(nextDate.getMonth() + 3)
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
    return nextDate.toISOString().split('T')[0]
  }

  async function verifyPendingPayment(reference: string) {
      setProcessing(true)

      const response = await fetch(`/api/payments/verify?reference=${reference}`)
      const data = await response.json()

      if (data.status === 'APPROVED' && user && plan) {
        const today = new Date().toISOString().split('T')[0]
        const nextPaymentDate = calculateNextPaymentDate()

        // Verificar que no se haya registrado ya
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('wompi_transaction_id', data.transactionId)
          .single()

        if (!existingPayment) {
          await supabase.from('payments').insert({
            user_id: user.id,
            plan_id: plan.id,
            amount_cop: getEffectivePrice(),
            status: 'completed',
            payment_method: 'pse',
            wompi_transaction_id: data.transactionId,
            period_start: today,
            period_end: nextPaymentDate,
            paid_at: new Date().toISOString(),
          })

          await supabase
            .from('users')
            .update({
              last_payment_date: today,
              next_payment_date: nextPaymentDate,
            })
            .eq('id', user.id)
        }

      setPaymentResult({ status: 'success', transactionId: data.transactionId })
    } else if (data.status === 'PENDING') {
      setPaymentResult({ status: 'pending', transactionId: data.transactionId })
    } else if (data.status && data.status !== 'NOT_FOUND') {
      setPaymentResult({ status: 'failed', transactionId: data.transactionId })
    }

    setProcessing(false)
    // Limpiar la URL para que no se verifique de nuevo
    window.history.replaceState({}, '', '/miembro/pagar')
  }


  async function handlePay() {
    if (!user || !plan) return
    if (!window.WidgetCheckout) {
      alert('El sistema de pagos está cargando. Intenta de nuevo en unos segundos.')
      return
    }

    setProcessing(true)

    const reference = generateReference()
    const effectivePrice = getEffectivePrice()
    const amountInCents = effectivePrice * 100
    const currency = 'COP'

    const signatureResponse = await fetch('/api/payments/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, amountInCents, currency }),
    })

    const { signature, error: sigError } = await signatureResponse.json()

    if (sigError || !signature) {
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
        const today = new Date().toISOString().split('T')[0]
        const nextPaymentDate = calculateNextPaymentDate()

        await supabase.from('payments').insert({
          user_id: user.id,
          plan_id: plan.id,
          amount_cop: effectivePrice,
          status: 'completed',
          payment_method: 'wompi',
          wompi_transaction_id: transaction.id,
          period_start: today,
          period_end: nextPaymentDate,
          paid_at: new Date().toISOString(),
        })

        await supabase
          .from('users')
          .update({
            last_payment_date: today,
            next_payment_date: nextPaymentDate,
          })
          .eq('id', user.id)

        setPaymentResult({ status: 'success', transactionId: transaction.id })
      } else if (transaction.status === 'PENDING') {
        setPaymentResult({ status: 'pending', transactionId: transaction.id })
      } else {
        setPaymentResult({ status: 'failed', transactionId: transaction.id })
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
                  Próximo pago: {formatDate(calculateNextPaymentDate())}
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