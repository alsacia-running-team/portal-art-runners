'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function RegistroPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    identification: '',
    email: '',
    phone: '',
    gender: '',
    birth_date: '',
    password: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Actualiza un campo del formulario
  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validación: las contraseñas deben coincidir
    if (formData.password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    // Validación: contraseña mínimo 6 caracteres
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Este correo ya está registrado')
      } else {
        setError('Error al crear la cuenta: ' + authError.message)
      }
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Error inesperado al crear la cuenta')
      setLoading(false)
      return
    }

    // 2. Crear registro en nuestra tabla users
    const { error: dbError } = await supabase.from('users').insert({
      auth_id: authData.user.id,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      identification: formData.identification,
      phone: formData.phone,
      gender: formData.gender,
      birth_date: formData.birth_date,
      role: 'member',
      account_status: 'pending',
      is_courtesy: false,
    })

    if (dbError) {
      setError('Error al guardar tus datos: ' + dbError.message)
      setLoading(false)
      return
    }

    // 3. Cerrar sesión porque la cuenta aún no está aprobada
    await supabase.auth.signOut()

    // 4. Mostrar mensaje de éxito
    setSuccess(true)
    setLoading(false)
  }

  // Si el registro fue exitoso, mostrar mensaje de confirmación
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              ¡Registro exitoso!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Tu solicitud ha sido enviada. Recibirás un correo cuando el
              administrador apruebe tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Volver al inicio de sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Alsacia Running Team
          </CardTitle>
          <CardDescription>
            Crea tu cuenta para unirte al equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Nombres y Apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombres *</Label>
                <Input
                  id="first_name"
                  placeholder="Tus nombres"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellidos *</Label>
                <Input
                  id="last_name"
                  placeholder="Tus apellidos"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Identificación */}
            <div className="space-y-2">
              <Label htmlFor="identification">Número de identificación *</Label>
              <Input
                id="identification"
                placeholder="Cédula de ciudadanía"
                value={formData.identification}
                onChange={(e) => updateField('identification', e.target.value)}
                required
              />
            </div>

            {/* Correo */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Número de teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="3001234567"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                required
              />
            </div>

            {/* Género y Fecha de nacimiento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Género *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateField('gender', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de nacimiento *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={formData.confirm_password}
                  onChange={(e) => updateField('confirm_password', e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}