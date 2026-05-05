'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { User, Plan } from '@/types/database'

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
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

  function getPaymentStatus(): { label: string; isAlDia: boolean } {
    if (!user) return { label: 'Sin datos', isAlDia: false }
    if (user.is_courtesy) return { label: 'Al día (cortesía)', isAlDia: true }
    if (!user.next_payment_date) return { label: 'Pendiente', isAlDia: false }

    const today = new Date()
    const nextPayment = new Date(user.next_payment_date)
    return today > nextPayment
      ? { label: 'Pendiente', isAlDia: false }
      : { label: 'Al día', isAlDia: true }
  }

  function getEffectivePrice() {
    return user?.custom_price_cop ?? plan?.price_cop ?? 0
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'No registrada'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-alsacia-pink-500">No se pudo cargar tu perfil.</p>
      </div>
    )
  }

  const paymentStatus = getPaymentStatus()

  return (
    <div>
      {/* Header del perfil con saludo */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Hola, {user.first_name}
        </h1>
        <p className="text-gray-500 mt-1">
          Aquí puedes ver tu información y el estado de tu cuenta.
        </p>
      </div>

      {/* Tarjeta resumen de estado */}
      <div className={`rounded-xl p-5 md:p-6 mb-6 ${
        paymentStatus.isAlDia
          ? 'bg-gradient-to-r from-alsacia-cyan-50 to-alsacia-cyan-100 border border-alsacia-cyan-200'
          : 'bg-gradient-to-r from-alsacia-pink-50 to-alsacia-pink-100 border border-alsacia-pink-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={`text-sm px-3 py-1 ${
                paymentStatus.isAlDia
                  ? 'bg-alsacia-cyan-500 hover:bg-alsacia-cyan-500 text-white'
                  : 'bg-alsacia-pink-500 hover:bg-alsacia-pink-500 text-white'
              }`}>
                {paymentStatus.label}
              </Badge>
              <Badge variant={user.account_status === 'approved' ? 'outline' : 'destructive'} className="text-sm">
                {user.account_status === 'approved' ? 'Activo' : 'Suspendido'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {plan
                ? `${plan.name} (${plan.frequency}) — ${formatPrice(getEffectivePrice())}`
                : 'Sin plan asignado'
              }
            </p>
            {user.next_payment_date && (
              <p className="text-sm text-gray-500 mt-1">
                Próximo pago: {formatDate(user.next_payment_date)}
              </p>
            )}
          </div>
          {!user.is_courtesy && plan && (
            <Link href="/miembro/pagar">
              <Button className="bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold h-11 px-6">
                {paymentStatus.isAlDia ? 'Realizar pago' : 'Pagar ahora'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-alsacia-blue-500">
              Datos personales
            </CardTitle>
            <Link href="/miembro/editar">
              <Button variant="outline" size="sm" className="text-alsacia-blue-500 border-alsacia-blue-200 hover:bg-alsacia-blue-50">
                Editar
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            <ProfileField label="Nombres" value={user.first_name} />
            <ProfileField label="Apellidos" value={user.last_name} />
            <ProfileField label="Identificación" value={user.identification} />
            <ProfileField label="Correo" value={user.email} />
            <ProfileField label="Teléfono" value={user.phone} />
            <ProfileField
              label="Género"
              value={user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
            />
            <ProfileField
              label="Fecha de nacimiento"
              value={formatDate(user.birth_date)}
            />
          </CardContent>
        </Card>

        {/* Datos de cuenta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-alsacia-blue-500">
              Datos de mi cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ProfileField
              label="Plan de entrenamiento"
              value={plan ? `${plan.name} (${plan.frequency})` : 'Sin plan asignado'}
            />
            {plan && (
              <ProfileField
                label="Valor del plan"
                value={formatPrice(getEffectivePrice())}
              />
            )}
            <ProfileField
              label="Fecha de ingreso"
              value={formatDate(user.joined_at)}
            />
            <ProfileField
              label="Último pago"
              value={formatDate(user.last_payment_date)}
            />
            <ProfileField
              label="Próximo pago"
              value={formatDate(user.next_payment_date)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}