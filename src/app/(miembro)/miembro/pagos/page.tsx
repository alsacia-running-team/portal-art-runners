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

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

    if (!userData) return

    const { data } = await supabase
      .from('payments')
      .select('*, plans(*)')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (data) setPayments(data as PaymentWithPlan[])
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
        return <Badge className="bg-alsacia-cyan-100 text-alsacia-cyan-700 hover:bg-alsacia-cyan-100 text-xs">Completado</Badge>
      case 'pending':
        return <Badge className="bg-alsacia-yellow-100 text-alsacia-yellow-700 hover:bg-alsacia-yellow-100 text-xs">Pendiente</Badge>
      case 'failed':
        return <Badge className="bg-alsacia-pink-100 text-alsacia-pink-700 hover:bg-alsacia-pink-100 text-xs">Fallido</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Historial de pagos</h1>
        <p className="text-gray-500 mt-1">Revisa todos tus pagos anteriores</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-alsacia-blue-500">
            {loading
              ? 'Cargando...'
              : `${payments.length} pago${payments.length !== 1 ? 's' : ''} registrado${payments.length !== 1 ? 's' : ''}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <p className="text-gray-400">Aún no tienes pagos registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell className="font-medium">{formatDate(payment.paid_at)}</TableCell>
                      <TableCell className="text-gray-500">
                        {payment.plans
                          ? `${payment.plans.name} (${payment.plans.frequency})`
                          : '—'
                        }
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {formatDate(payment.period_start)} — {formatDate(payment.period_end)}
                      </TableCell>
                      <TableCell className="font-semibold text-alsacia-blue-700">
                        {formatPrice(payment.amount_cop)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}