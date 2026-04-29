'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User, Plan } from '@/types/database'

export default function EditarClientePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [formData, setFormData] = useState<Partial<User>>({})
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadClient()
    loadPlans()
  }, [])

  async function loadClient() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!error && data) {
      setFormData(data)
    }
    setLoading(false)
  }

  async function loadPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)

    if (data) setPlans(data)
  }

  function updateField(field: string, value: string | boolean | null) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        identification: formData.identification,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        birth_date: formData.birth_date,
        plan_id: formData.plan_id,
        account_status: formData.account_status,
        is_courtesy: formData.is_courtesy,
        joined_at: formData.joined_at,
        cutoff_date: formData.cutoff_date,
        next_payment_date: formData.next_payment_date,
      })
      .eq('id', clientId)

    if (updateError) {
      setError('Error al guardar: ' + updateError.message)
    } else {
      setSuccess(true)
    }

    setSaving(false)
  }

  // Calcular estado de pago
  function getPaymentStatus(): { label: string; isAlDia: boolean } {
    if (formData.is_courtesy) {
      return { label: 'Al día (cortesía)', isAlDia: true }
    }
    if (!formData.next_payment_date) {
      return { label: 'Pendiente', isAlDia: false }
    }
    const today = new Date()
    const nextPayment = new Date(formData.next_payment_date)
    if (today > nextPayment) {
      return { label: 'Pendiente', isAlDia: false }
    }
    return { label: 'Al día', isAlDia: true }
  }

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return 'No registrada'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return <p className="text-gray-500">Cargando datos del cliente...</p>
  }

  if (!formData.id) {
    return <p className="text-red-500">No se encontró el cliente.</p>
  }

  const paymentStatus = getPaymentStatus()

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/admin/clientes')}>
          ← Volver
        </Button>
        <h1 className="text-2xl font-bold">
          Editar: {formData.first_name} {formData.last_name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombres</Label>
                <Input
                  value={formData.first_name || ''}
                  onChange={(e) => updateField('first_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input
                  value={formData.last_name || ''}
                  onChange={(e) => updateField('last_name', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Identificación</Label>
              <Input
                value={formData.identification || ''}
                onChange={(e) => updateField('identification', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Género</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => updateField('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos de gestión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Estado de cuenta</Label>
              <Select
                value={formData.account_status || ''}
                onValueChange={(value) => updateField('account_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Activo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plan de entrenamiento</Label>
              <Select
                value={formData.plan_id || 'sin_plan'}
                onValueChange={(value) =>
                  updateField('plan_id', value === 'sin_plan' ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_plan">Sin plan</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.frequency}) — ${plan.price_cop.toLocaleString('es-CO')} COP
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de ingreso</Label>
              <Input
                type="date"
                value={formData.joined_at || ''}
                onChange={(e) => updateField('joined_at', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de corte</Label>
              <Input
                type="date"
                value={formData.cutoff_date || ''}
                onChange={(e) => updateField('cutoff_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Próximo pago</Label>
              <Input
                type="date"
                value={formData.next_payment_date || ''}
                onChange={(e) => updateField('next_payment_date', e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Último pago</span>
              <span className="text-sm font-medium">
                {formatDate(formData.last_payment_date)}
              </span>
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

            {/* Campo oculto para el cliente: Cortesía */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Cortesía</p>
                  <p className="text-xs text-amber-600">
                    Campo visible solo para el administrador
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={formData.is_courtesy ? 'default' : 'outline'}
                  className={formData.is_courtesy ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  onClick={() => updateField('is_courtesy', !formData.is_courtesy)}
                >
                  {formData.is_courtesy ? 'Sí' : 'No'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mensajes y botón guardar */}
      <div className="mt-6 flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>

        {success && (
          <span className="text-green-600 text-sm font-medium">
            ✓ Cambios guardados correctamente
          </span>
        )}

        {error && (
          <span className="text-red-600 text-sm font-medium">
            {error}
          </span>
        )}
      </div>
    </div>
  )
}