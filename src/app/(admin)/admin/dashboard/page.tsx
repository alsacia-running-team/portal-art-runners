'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingApprovals: 0,
    activeMembers: 0,
    suspendedMembers: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    // Traer todos los usuarios que no son admin
    const { data: users } = await supabase
      .from('users')
      .select('account_status')
      .eq('role', 'member')

    if (users) {
      setStats({
        totalMembers: users.length,
        pendingApprovals: users.filter(u => u.account_status === 'pending').length,
        activeMembers: users.filter(u => u.account_status === 'approved').length,
        suspendedMembers: users.filter(u => u.account_status === 'suspended').length,
      })
    }
    setLoading(false)
  }

  const cards = [
    { title: 'Total miembros', value: stats.totalMembers, color: 'text-gray-900' },
    { title: 'Pendientes de aprobación', value: stats.pendingApprovals, color: 'text-amber-600' },
    { title: 'Activos', value: stats.activeMembers, color: 'text-green-600' },
    { title: 'Suspendidos', value: stats.suspendedMembers, color: 'text-red-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${card.color}`}>
                {loading ? '...' : card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}