'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '@/types/database'

export default function EditarDatosPage() {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (data) setFormData(data)
    setLoading(false)
  }

  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        gender: formData.gender,
        birth_date: formData.birth_date,
      })
      .eq('id', formData.id)

    if (updateError) {
      setError('Error al guardar: ' + updateError.message)
    } else {
      setSuccess(true)
    }

    setSaving(false)
  }

  if (loading) {
    return <p className="text-gray-500">Cargando datos...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editar mis datos</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombres</Label>
                <Input
                  value={formData.first_name || ''}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input
                  value={formData.last_name || ''}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  required
                />
              </div>
            </div>

            {/* Campos no editables por el miembro */}
            <div className="space-y-2">
              <Label className="text-gray-400">Correo electrónico</Label>
              <Input value={formData.email || ''} disabled />
              <p className="text-xs text-gray-400">
                El correo no se puede cambiar. Contacta al administrador.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Identificación</Label>
              <Input value={formData.identification || ''} disabled />
              <p className="text-xs text-gray-400">
                La identificación no se puede cambiar. Contacta al administrador.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md border border-green-200">
                ✓ Datos actualizados correctamente
              </div>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}