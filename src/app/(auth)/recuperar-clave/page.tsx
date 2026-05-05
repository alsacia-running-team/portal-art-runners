'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RecuperarClavePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/actualizar-clave` }
    )

    if (resetError) {
      setError('Error al enviar el correo. Verifica tu dirección e intenta de nuevo.')
    } else {
      setSent(true)
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
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-alsacia-cyan-100 mb-6">
                <svg className="w-8 h-8 text-alsacia-cyan-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-alsacia-blue-500 mb-3">
                ¡Correo enviado!
              </h2>
              <p className="text-gray-600 mb-8">
                Revisa tu bandeja de entrada en <strong>{email}</strong>.
                Haz clic en el enlace del correo para crear tu nueva contraseña.
              </p>
              <Link href="/login">
                <Button className="w-full h-12 bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold text-base">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-alsacia-blue-500 mb-2">
                  Recuperar contraseña
                </h2>
                <p className="text-gray-500">
                  Te enviaremos un correo con un enlace para restablecer tu contraseña
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <Link href="/login" className="text-alsacia-blue-500 hover:text-alsacia-blue-700 font-semibold text-sm">
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}