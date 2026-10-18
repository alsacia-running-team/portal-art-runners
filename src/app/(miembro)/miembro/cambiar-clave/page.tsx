'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CambiarClavePage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    setSaving(true)

    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(data.error || 'No se pudo cambiar la contraseña. Intenta de nuevo.')
    } else {
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setSaving(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cambiar contraseña</h1>
        <p className="text-gray-500 mt-1">Reemplaza la contraseña temporal por una que recuerdes</p>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-alsacia-blue-500">Nueva contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-gray-700 font-medium">
                Contraseña actual
              </Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 border-gray-200"
                required
              />
              <p className="text-xs text-gray-500">
                Si es tu primer cambio, es la contraseña que te llegó por correo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-gray-700 font-medium">
                Nueva contraseña
              </Label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 border-gray-200"
                required
              />
              <p className="text-xs text-gray-500">Mínimo 6 caracteres.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-gray-700 font-medium">
                Confirmar nueva contraseña
              </Label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 border-gray-200"
                required
              />
            </div>

            {error && (
              <div className="bg-alsacia-pink-50 text-alsacia-pink-700 text-sm p-4 rounded-lg border border-alsacia-pink-200">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-alsacia-cyan-50 text-alsacia-cyan-700 text-sm p-4 rounded-lg border border-alsacia-cyan-200">
                Contraseña actualizada. La próxima vez que ingreses usa la nueva contraseña.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                className="flex-1 h-12 bg-alsacia-blue-500 hover:bg-alsacia-blue-600 text-white font-semibold text-base"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Cambiar contraseña'}
              </Button>
              <Link href="/miembro/perfil" className="flex-1">
                <Button type="button" variant="outline" className="w-full h-12 text-gray-600">
                  Volver al perfil
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
