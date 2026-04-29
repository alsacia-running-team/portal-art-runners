'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Payment, Plan } from '@/types/database'

type PaymentWithPlan = Payment & { plans: Plan | null }

export default function HistorialPagosPage() {
  const [payments, setPayments] = useState<PaymentWithPlan[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    // Primero obtener el id del usuario en nuestra tabla
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

    if (!userData) return

    // Traer los pagos con datos del plan
    const { data } = await supabase
      .from('payments')
      .select('*, plans(*)')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (data) {
      setPayments(data as PaymentWithPlan[])
    }
    setLoading(false)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatPrice(amount: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completado</Badge>
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Historial de pagos</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {loading
              ? 'Cargando...'
              : `${payments.length} pago${payments.length !== 1 ? 's' : ''} registrado${payments.length !== 1 ? 's' : ''}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aún no tienes pagos registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paid_at)}</TableCell>
                    <TableCell>
                      {payment.plans
                        ? `${payment.plans.name} (${payment.plans.frequency})`
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(payment.period_start)} — {formatDate(payment.period_end)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(payment.amount_cop)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}