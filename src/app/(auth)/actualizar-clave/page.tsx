'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ActualizarClavePage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Error al actualizar la contraseña: ' + updateError.message)
    } else {
      await supabase.auth.signOut()
      setSuccess(true)
      // Limpiar la URL para invalidar el código de recuperación
      window.history.replaceState({}, '', '/actualizar-clave')
      setTimeout(() => router.replace('/login'), 3000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado visual */}
      <div className="relative lg:w-1/2 bg-alsacia-blue-700 overflow-hidden min-h-[280px] lg:min-h-screen">
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
          <div className="w-full max-w-[300px] lg:max-w-[480px]">
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

      {/* Lado del formulario */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-alsacia-cyan-100 mb-6">
                <svg className="w-8 h-8 text-alsacia-cyan-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-alsacia-blue-500 mb-3">
                ¡Contraseña actualizada!
              </h2>
              <p className="text-gray-600">
                Tu contraseña se ha cambiado correctamente.
                Serás redirigido al inicio de sesión...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-alsacia-blue-500 mb-2">
                  Nueva contraseña
                </h2>
                <p className="text-gray-500">
                  Ingresa tu nueva contraseña
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Nueva contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-gray-700 font-medium">
                    Confirmar contraseña
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 border-gray-200 focus:border-alsacia-blue-500 focus:ring-alsacia-blue-500"
                    required
                  />
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
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}