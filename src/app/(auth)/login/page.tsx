'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

    // 1. Intentar iniciar sesión con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // 2. Buscar el usuario en nuestra tabla users
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

    // 3. Verificar si la cuenta está aprobada
    if (userData.account_status === 'pending') {
      setError('Tu cuenta aún no ha sido aprobada. Espera la confirmación por correo.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (userData.account_status === 'suspended') {
      // Los suspendidos pueden entrar pero ven su estado
    }

    // 4. Redirigir según el rol
    if (userData.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/miembro/perfil')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Alsacia Running Team
          </CardTitle>
          <CardDescription>
            Ingresa a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p>
              <Link
                href="/recuperar-clave"
                className="text-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link
                href="/registro"
                className="text-blue-600 hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}