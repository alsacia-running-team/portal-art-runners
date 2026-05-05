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
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Editar mis datos</h1>
        <p className="text-gray-500 mt-1">Actualiza tu información personal</p>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-alsacia-blue-500">Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Nombres</Label>
                <Input
                  value={formData.first_name || ''}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  className="h-12 border-gray-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Apellidos</Label>
                <Input
                  value={formData.last_name || ''}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  className="h-12 border-gray-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Teléfono</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="h-12 border-gray-200"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Género</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => updateField('gender', value)}
                >
                  <SelectTrigger className="h-12 border-gray-200">
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
                  className="h-12 border-gray-200"
                  required
                />
              </div>
            </div>

            {/* Campos no editables */}
            <div className="space-y-2">
              <Label className="text-gray-400 font-medium">Correo electrónico</Label>
              <Input value={formData.email || ''} disabled className="h-12 bg-gray-50" />
              <p className="text-xs text-gray-400">
                El correo no se puede cambiar. Contacta al administrador.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 font-medium">Identificación</Label>
              <Input value={formData.identification || ''} disabled className="h-12 bg-gray-50" />
              <p className="text-xs text-gray-400">
                La identificación no se puede cambiar. Contacta al administrador.
              </p>
            </div>

            {error && (
              <div className="bg-alsacia-pink-50 text-alsacia-pink-700 text-sm p-4 rounded-lg border border-alsacia-pink-200">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-alsacia-cyan-50 text-alsacia-cyan-700 text-sm p-4 rounded-lg border border-alsacia-cyan-200">
                Datos actualizados correctamente
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold text-base"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}