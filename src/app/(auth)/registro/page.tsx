'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
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

  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

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

    await supabase.auth.signOut()
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="relative lg:w-1/2 bg-alsacia-blue-700 overflow-hidden min-h-[320px] lg:min-h-screen">
          <div className="absolute inset-0">
            <Image
              src="/images/runner-hero.png"
              alt="Equipo Alsacia Running"
              fill
              className="object-cover object-center"
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-alsacia-blue-900/50 via-alsacia-blue-700/35 to-alsacia-blue-900/65" />
          <div className="relative z-10 flex flex-col justify-center items-center h-full p-8 lg:p-16 text-white text-center min-h-[320px] lg:min-h-screen">
            <div className="w-full max-w-[340px] lg:max-w-[520px]">
              <Image
                src="/images/logo.png"
                alt="Alsacia Running Team"
                width={3427}
                height={841}
                className="mx-auto h-auto w-full mix-blend-screen"
                priority
              />
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-alsacia-cyan-100 mb-6">
              <svg
                className="w-8 h-8 text-alsacia-cyan-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-alsacia-blue-500 mb-3">
              ¡Solicitud enviada!
            </h2>
            <p className="text-gray-600 mb-8">
              Tu registro fue exitoso. Recibirás un correo cuando el administrador
              apruebe tu cuenta.
            </p>
            <Link href="/login">
              <Button className="w-full h-12 bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold text-base">
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado visual */}
      <div className="relative lg:w-1/2 bg-alsacia-blue-700 overflow-hidden min-h-[280px] lg:min-h-screen lg:sticky lg:top-0">
        <div className="absolute inset-0">
          <Image
            src="/images/runner-hero.png"
            alt="Equipo Alsacia Running"
            fill
            className="object-cover object-center"
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-alsacia-blue-900/50 via-alsacia-blue-700/35 to-alsacia-blue-900/65" />
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-8 lg:p-16 text-white text-center min-h-[280px] lg:min-h-screen">
          <div className="mb-8 w-full max-w-[300px] lg:max-w-[480px]">
            <Image
              src="/images/logo.png"
              alt="Alsacia Running Team"
              width={3427}
              height={841}
              className="mx-auto h-auto w-full mix-blend-screen"
              priority
            />
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold mb-3 tracking-tight">
            Únete al equipo
          </h1>
          <p className="text-base lg:text-lg text-alsacia-cyan-200 max-w-md">
            Forma parte de Alsacia Running Team y lleva tu entrenamiento al siguiente nivel.
          </p>
        </div>
      </div>

      {/* Lado del formulario */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-lg py-8">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-alsacia-blue-500 mb-2">
              Crea tu cuenta
            </h2>
            <p className="text-gray-500">
              Completa tus datos para enviar tu solicitud
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-gray-700 font-medium">
                  Nombres
                </Label>
                <Input
                  id="first_name"
                  placeholder="Tus nombres"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-gray-700 font-medium">
                  Apellidos
                </Label>
                <Input
                  id="last_name"
                  placeholder="Tus apellidos"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identification" className="text-gray-700 font-medium">
                Número de identificación
              </Label>
              <Input
                id="identification"
                placeholder="Cédula de ciudadanía"
                value={formData.identification}
                onChange={(e) => updateField('identification', e.target.value)}
                className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="3001234567"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-gray-700 font-medium">
                  Género
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateField('gender', value)}
                  required
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500">
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
                <Label htmlFor="birth_date" className="text-gray-700 font-medium">
                  Fecha de nacimiento
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                  className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-gray-700 font-medium">
                  Confirmar
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={formData.confirm_password}
                  onChange={(e) => updateField('confirm_password', e.target.value)}
                  className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-alsacia-pink-50 text-alsacia-pink-700 text-sm p-4 rounded-lg border border-alsacia-pink-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold text-base"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              ¿Ya eres parte del equipo?{' '}
              <Link
                href="/login"
                className="text-alsacia-blue-500 hover:text-alsacia-blue-700 font-semibold"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}