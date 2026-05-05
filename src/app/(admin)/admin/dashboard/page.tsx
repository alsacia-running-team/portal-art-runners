'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import type { User } from '@/types/database'

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const { data } = await supabase
      .from('users')
      .select('account_status, next_payment_date, is_courtesy')
      .eq('role', 'member')

    if (data) setUsers(data as User[])
    setLoading(false)
  }

  function getPaymentStatusCount() {
    let alDia = 0
    let pendiente = 0

    users.forEach((user) => {
      if (user.account_status === 'pending') return
      if (user.is_courtesy) {
        alDia++
        return
      }
      if (!user.next_payment_date) {
        pendiente++
        return
      }
      const today = new Date()
      const nextPayment = new Date(user.next_payment_date)
      if (today > nextPayment) {
        pendiente++
      } else {
        alDia++
      }
    })

    return { alDia, pendiente }
  }

  const totalMembers = users.filter(u => u.account_status !== 'pending').length
  const pendingApprovals = users.filter(u => u.account_status === 'pending').length
  const activeMembers = users.filter(u => u.account_status === 'approved').length
  const suspendedMembers = users.filter(u => u.account_status === 'suspended').length
  const { alDia, pendiente } = getPaymentStatusCount()

  const stats = [
    {
      title: 'Total miembros',
      value: totalMembers,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      bg: 'bg-alsacia-blue-50',
      iconColor: 'text-alsacia-blue-500',
      valueColor: 'text-alsacia-blue-700',
    },
    {
      title: 'Pendientes aprobación',
      value: pendingApprovals,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-alsacia-yellow-50',
      iconColor: 'text-alsacia-yellow-600',
      valueColor: 'text-alsacia-yellow-700',
    },
    {
      title: 'Activos',
      value: activeMembers,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-alsacia-cyan-50',
      iconColor: 'text-alsacia-cyan-600',
      valueColor: 'text-alsacia-cyan-700',
    },
    {
      title: 'Suspendidos',
      value: suspendedMembers,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      bg: 'bg-alsacia-pink-50',
      iconColor: 'text-alsacia-pink-500',
      valueColor: 'text-alsacia-pink-700',
    },
    {
      title: 'Al día en pagos',
      value: alDia,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
      bg: 'bg-alsacia-cyan-50',
      iconColor: 'text-alsacia-cyan-600',
      valueColor: 'text-alsacia-cyan-700',
    },
    {
      title: 'Pendientes de pago',
      value: pendiente,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      bg: 'bg-alsacia-yellow-50',
      iconColor: 'text-alsacia-yellow-600',
      valueColor: 'text-alsacia-yellow-700',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general de Alsacia Running Team</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <span className={stat.iconColor}>{stat.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.valueColor}`}>
                    {loading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}