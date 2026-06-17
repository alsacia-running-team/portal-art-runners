'use client'

import { useState } from 'react'
import Image from 'next/image'
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
import {
  INTERESTED_PLANS,
  LIVES_IN_ALSACIA_OPTIONS,
  TRAINING_LEVELS,
  TRAINING_GOALS,
  STRENGTH_TRAINING_OPTIONS,
} from '@/lib/registro-options'
import { HomeLinkButton } from '@/components/auth-chrome'

export default function RegistroPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    birth_date: '',
    interested_plan: '',
    lives_in_alsacia: '',
    training_level: '',
    training_goal: '',
    strength_training: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'No se pudo enviar tu solicitud. Intenta de nuevo.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        <HomeLinkButton />

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
              Tu solicitud fue enviada con éxito. Cuando el administrador la apruebe,
              recibirás un correo con tu contraseña para ingresar al portal.
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
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      <HomeLinkButton />

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
              Registrate
            </h2>
            <p className="text-gray-500">
              Completa tus datos para enviar tu solicitud, pronto serás contactado
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
                Whatsapp / Teléfono
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

            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-alsacia-blue-500 pt-4 mb-1">
                Cuéntanos sobre ti
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Esto nos ayuda a ubicarte en el plan adecuado.
              </p>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Plan que te interesa
                  </Label>
                  <Select
                    value={formData.interested_plan}
                    onValueChange={(value) => updateField('interested_plan', value)}
                    required
                  >
                    <SelectTrigger className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500">
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERESTED_PLANS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    ¿Vives en el sector de Ciudad Alsacia, Bogotá o alrededores?
                  </Label>
                  <Select
                    value={formData.lives_in_alsacia}
                    onValueChange={(value) => updateField('lives_in_alsacia', value)}
                    required
                  >
                    <SelectTrigger className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {LIVES_IN_ALSACIA_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Nivel de entrenamiento (atletismo, ciclismo)
                  </Label>
                  <Select
                    value={formData.training_level}
                    onValueChange={(value) => updateField('training_level', value)}
                    required
                  >
                    <SelectTrigger className="h-auto min-h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500 whitespace-normal text-left">
                      <SelectValue placeholder="Selecciona tu nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_LEVELS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    ¿Cuál es tu objetivo principal de entrenamiento en este momento?
                  </Label>
                  <Select
                    value={formData.training_goal}
                    onValueChange={(value) => updateField('training_goal', value)}
                    required
                  >
                    <SelectTrigger className="h-auto min-h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500 whitespace-normal text-left">
                      <SelectValue placeholder="Selecciona tu objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_GOALS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    ¿Realizas actualmente entrenamiento de fuerza?
                  </Label>
                  <Select
                    value={formData.strength_training}
                    onValueChange={(value) => updateField('strength_training', value)}
                    required
                  >
                    <SelectTrigger className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRENGTH_TRAINING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
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
