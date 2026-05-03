'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { User, Plan } from '@/types/database'

// Declarar el tipo del widget de Wompi para TypeScript
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

  useEffect(() => {
    loadUserData()
    loadWompiScript()
  }, [])

  // Cargar el script del widget de Wompi
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

  // Generar referencia única para la transacción
  function generateReference() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `ART-${timestamp}-${random}`
  }

  // Calcular fecha del próximo pago según el plan
  function calculateNextPaymentDate(): string {
    const baseDate = user?.cutoff_date ? new Date(user.cutoff_date) : new Date()
    const nextDate = new Date(baseDate)

    if (plan?.frequency === 'trimestral') {
      nextDate.setMonth(nextDate.getMonth() + 3)
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }

    return nextDate.toISOString().split('T')[0]
  }

  function getEffectivePrice() {
    return user?.custom_price_cop ?? plan?.price_cop ?? 0
  }

  // Abrir el widget de Wompi
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

    // Obtener la firma de integridad desde nuestro servidor
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
      currency: currency,
      amountInCents: amountInCents,
      reference: reference,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      'signature:integrity': signature,
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

  // Calcular estado de pago actual
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
    return <p className="text-gray-500">Cargando información de pago...</p>
  }

  // Si el usuario no tiene plan asignado
  if (!plan) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Realizar pago</h1>
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <p className="text-gray-500 text-center py-8">
              Aún no tienes un plan asignado. Contacta al administrador para que te
              asigne un plan de entrenamiento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si es cortesía, no necesita pagar
  if (user?.is_courtesy) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Realizar pago</h1>
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <p className="text-green-600 text-center py-8">
              Tu cuenta está marcada como cortesía. No necesitas realizar pagos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const paymentStatus = getPaymentStatus()
  const effectivePrice = getEffectivePrice()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Realizar pago</h1>

      {/* Resultado del pago */}
      {paymentResult.status && (
        <Card className={`max-w-lg mb-6 ${
          paymentResult.status === 'success'
            ? 'border-green-200 bg-green-50'
            : paymentResult.status === 'pending'
            ? 'border-amber-200 bg-amber-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <CardContent className="pt-6 text-center">
            {paymentResult.status === 'success' && (
              <>
                <p className="text-green-700 text-lg font-semibold mb-2">
                  ¡Pago realizado con éxito!
                </p>
                <p className="text-green-600 text-sm">
                  ID de transacción: {paymentResult.transactionId}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Tu próximo pago es el {formatDate(calculateNextPaymentDate())}
                </p>
              </>
            )}
            {paymentResult.status === 'pending' && (
              <>
                <p className="text-amber-700 text-lg font-semibold mb-2">
                  Pago en proceso
                </p>
                <p className="text-amber-600 text-sm">
                  Tu pago está siendo procesado. Puede tomar unos minutos.
                </p>
              </>
            )}
            {paymentResult.status === 'failed' && (
              <>
                <p className="text-red-700 text-lg font-semibold mb-2">
                  Pago no completado
                </p>
                <p className="text-red-600 text-sm">
                  Hubo un problema con tu pago. Intenta de nuevo o usa otro método.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen del pago */}
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Resumen</CardTitle>
          <CardDescription>Revisa los datos antes de pagar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Plan</span>
            <span className="text-sm font-medium">{plan.name} ({plan.frequency})</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Valor a pagar</span>
            <span className="text-lg font-bold">{formatPrice(effectivePrice)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Estado de pago</span>
            <Badge
              variant={paymentStatus.isAlDia ? 'default' : 'destructive'}
              className={paymentStatus.isAlDia ? 'bg-green-600' : ''}
            >
              {paymentStatus.label}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Próximo pago</span>
            <span className="text-sm font-medium">{formatDate(user?.next_payment_date ?? null)}</span>
          </div>

          <Button
            className="w-full mt-4"
            size="lg"
            onClick={handlePay}
            disabled={processing}
          >
            {processing ? 'Procesando...' : `Pagar ${formatPrice(effectivePrice)}`}
          </Button>

          <p className="text-xs text-gray-400 text-center mt-2">
            Serás redirigido a Wompi para completar el pago de forma segura.
            Puedes pagar con tarjeta, PSE, Nequi y más.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
