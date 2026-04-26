'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    // 1. Obtener el usuario autenticado
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return

    // 2. Traer sus datos de nuestra tabla users
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (userData) {
      setUser(userData)

      // 3. Si tiene plan asignado, traer los datos del plan
      if (userData.plan_id) {
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('id', userData.plan_id)
          .single()

        if (planData) {
          setPlan(planData)
        }
      }
    }

    setLoading(false)
  }

  // Calcular el estado de pago (no se guarda en BD, se calcula en tiempo real)
  function getPaymentStatus(): { label: string; variant: 'success' | 'warning' } {
    if (!user) return { label: 'Sin datos', variant: 'warning' }

    // Si es cortesía, siempre está al día
    if (user.is_courtesy) {
      return { label: 'Al día', variant: 'success' }
    }

    // Si no tiene fecha de próximo pago, está pendiente
    if (!user.next_payment_date) {
      return { label: 'Pendiente', variant: 'warning' }
    }

    // Comparar fecha actual con fecha de próximo pago
    const today = new Date()
    const nextPayment = new Date(user.next_payment_date)

    if (today > nextPayment) {
      return { label: 'Pendiente', variant: 'warning' }
    }

    return { label: 'Al día', variant: 'success' }
  }

  // Formatear fecha legible
  function formatDate(dateString: string | null) {
    if (!dateString) return 'No registrada'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Formatear precio en pesos colombianos
  function formatPrice(amount: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return <p className="text-gray-500">Cargando perfil...</p>
  }

  if (!user) {
    return <p className="text-red-500">No se pudo cargar tu perfil.</p>
  }

  const paymentStatus = getPaymentStatus()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* Datos de gestión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de mi cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Estado de cuenta</span>
              <Badge
                variant={user.account_status === 'approved' ? 'default' : 'destructive'}
              >
                {user.account_status === 'approved' ? 'Activo' : 'Suspendido'}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Estado de pago</span>
              <Badge
                variant={paymentStatus.variant === 'success' ? 'default' : 'destructive'}
                className={paymentStatus.variant === 'success' ? 'bg-green-600' : ''}
              >
                {paymentStatus.label}
              </Badge>
            </div>

            <ProfileField
              label="Plan de entrenamiento"
              value={plan ? `${plan.name} (${plan.frequency})` : 'Sin plan asignado'}
            />

            {plan && (
              <ProfileField
                label="Valor del plan"
                value={formatPrice(plan.price_cop)}
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

// Componente reutilizable para mostrar un campo con su etiqueta
function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}