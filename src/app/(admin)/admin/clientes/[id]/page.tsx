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

    if (!error && data) setFormData(data)
    setLoading(false)
  }

  async function loadPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
    if (data) setPlans(data)
  }

  function updateField(field: string, value: string | number | boolean | null) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  function updatePlan(planId: string) {
    if (planId === 'sin_plan') {
      setFormData(prev => ({
        ...prev,
        plan_id: null,
        custom_price_cop: null,
      }))
      setSuccess(false)
      return
    }

    const selectedPlan = plans.find((plan) => plan.id === planId)
    setFormData(prev => ({
      ...prev,
      plan_id: planId,
      custom_price_cop: selectedPlan?.price_cop ?? prev.custom_price_cop ?? null,
    }))
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
        custom_price_cop: formData.plan_id ? formData.custom_price_cop : null,
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

  function getPaymentStatus(): { label: string; isAlDia: boolean } {
    if (formData.is_courtesy) return { label: 'Al día (cortesía)', isAlDia: true }
    if (!formData.next_payment_date) return { label: 'Pendiente', isAlDia: false }
    const today = new Date()
    const nextPayment = new Date(formData.next_payment_date)
    if (today > nextPayment) return { label: 'Pendiente', isAlDia: false }
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
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Cargando datos del cliente...</p>
      </div>
    )
  }

  if (!formData.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-alsacia-pink-500">No se encontró el cliente.</p>
      </div>
    )
  }

  const paymentStatus = getPaymentStatus()
  const selectedPlan = plans.find((plan) => plan.id === formData.plan_id)
  const planPriceValue = formData.custom_price_cop ?? selectedPlan?.price_cop ?? ''

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          className="text-alsacia-blue-500 border-alsacia-blue-200 hover:bg-alsacia-blue-50"
          onClick={() => router.push('/admin/clientes')}
        >
          ← Volver
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {formData.first_name} {formData.last_name}
          </h1>
          <p className="text-gray-500 mt-1">Editar información del cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-alsacia-blue-500">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Nombres</Label>
                <Input
                  value={formData.first_name || ''}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  className="h-11 border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Apellidos</Label>
                <Input
                  value={formData.last_name || ''}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  className="h-11 border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Identificación</Label>
              <Input
                value={formData.identification || ''}
                onChange={(e) => updateField('identification', e.target.value)}
                className="h-11 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Correo electrónico</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="h-11 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Teléfono</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="h-11 border-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Género</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => updateField('gender', value)}
                >
                  <SelectTrigger className="h-11 border-gray-200">
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
                <Label className="text-gray-700 font-medium">Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                  className="h-11 border-gray-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos de gestión */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-alsacia-blue-500">Datos de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Estado de cuenta</Label>
              <Select
                value={formData.account_status || ''}
                onValueChange={(value) => updateField('account_status', value)}
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Activo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Plan de entrenamiento</Label>
              <Select
                value={formData.plan_id || 'sin_plan'}
                onValueChange={updatePlan}
              >
                <SelectTrigger className="h-11 border-gray-200">
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
              <Label className="text-gray-700 font-medium">Precio aplicado al miembro (COP)</Label>
              <Input
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={planPriceValue}
                disabled={!formData.plan_id}
                placeholder="Selecciona un plan"
                className="h-11 border-gray-200"
                onChange={(e) => {
                  const value = e.target.value
                  updateField('custom_price_cop', value === '' ? null : Number(value))
                }}
              />
              {selectedPlan && (
                <p className="text-xs text-gray-500">
                  Precio base del plan: ${selectedPlan.price_cop.toLocaleString('es-CO')} COP
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Fecha de ingreso</Label>
              <Input
                type="date"
                value={formData.joined_at || ''}
                onChange={(e) => updateField('joined_at', e.target.value)}
                className="h-11 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Fecha de corte</Label>
              <Input
                type="date"
                value={formData.cutoff_date || ''}
                onChange={(e) => updateField('cutoff_date', e.target.value)}
                className="h-11 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Próximo pago</Label>
              <Input
                type="date"
                value={formData.next_payment_date || ''}
                onChange={(e) => updateField('next_payment_date', e.target.value)}
                className="h-11 border-gray-200"
              />
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Último pago</span>
              <span className="text-sm font-medium">{formatDate(formData.last_payment_date)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Estado de pago</span>
              <Badge className={`text-xs ${
                paymentStatus.isAlDia
                  ? 'bg-alsacia-cyan-100 text-alsacia-cyan-700 hover:bg-alsacia-cyan-100'
                  : 'bg-alsacia-yellow-100 text-alsacia-yellow-700 hover:bg-alsacia-yellow-100'
              }`}>
                {paymentStatus.label}
              </Badge>
            </div>

            {/* Campo cortesía */}
            <div className="bg-alsacia-yellow-50 border border-alsacia-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-alsacia-yellow-800">Cortesía</p>
                  <p className="text-xs text-alsacia-yellow-600">
                    Campo visible solo para el administrador
                  </p>
                </div>
                <Button
                  size="sm"
                  className={formData.is_courtesy
                    ? 'bg-alsacia-yellow-500 hover:bg-alsacia-yellow-600 text-white'
                    : 'bg-white border border-alsacia-yellow-300 text-alsacia-yellow-700 hover:bg-alsacia-yellow-50'
                  }
                  onClick={() => updateField('is_courtesy', !formData.is_courtesy)}
                >
                  {formData.is_courtesy ? 'Sí' : 'No'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón guardar y mensajes */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          className="h-12 px-8 bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>

        {success && (
          <span className="text-alsacia-cyan-700 text-sm font-medium bg-alsacia-cyan-50 px-4 py-2 rounded-lg">
            Cambios guardados correctamente
          </span>
        )}

        {error && (
          <span className="text-alsacia-pink-700 text-sm font-medium bg-alsacia-pink-50 px-4 py-2 rounded-lg">
            {error}
          </span>
        )}
      </div>
    </div>
  )
}