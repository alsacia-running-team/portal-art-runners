'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, account_status')
      .eq('auth_id', authData.user.id)
      .single()

    if (userError || !userData) {
      setError('No se encontró tu cuenta. Contacta al administrador.')
      setLoading(false)
      return
    }

    if (userData.account_status === 'pending') {
      setError('Tu cuenta aún no ha sido aprobada. Espera la confirmación por correo.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (userData.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/miembro/perfil')
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado visual — imagen y branding */}
      <div className="relative lg:w-1/2 bg-alsacia-blue-700 overflow-hidden min-h-[320px] lg:min-h-screen">
        {/* Imagen de fondo del equipo */}
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

        {/* Overlay azul para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-alsacia-blue-900/50 via-alsacia-blue-700/35 to-alsacia-blue-900/65" />

        {/* Contenido sobre la imagen */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-8 lg:p-16 text-white text-center min-h-[320px] lg:min-h-screen">
          <div className="mb-8 w-full max-w-[340px] lg:max-w-[520px]">
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
            Bienvenido, runner
          </h1>
          <p className="text-base lg:text-lg text-alsacia-cyan-200 max-w-md">
            Accede a tu cuenta para gestionar tu plan de entrenamiento y tus pagos.
          </p>
        </div>
      </div>

      {/* Lado del formulario */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-alsacia-blue-500 mb-2">
              Iniciar sesión
            </h2>
            <p className="text-gray-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                required
              />
              <div className="text-right">
                <Link
                  href="/recuperar-clave"
                  className="text-sm text-alsacia-blue-500 hover:text-alsacia-blue-700 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
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
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              ¿Aún no eres parte del equipo?{' '}
              <Link
                href="/registro"
                className="text-alsacia-blue-500 hover:text-alsacia-blue-700 font-semibold"
              ><br></br>
                Únete ahora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
