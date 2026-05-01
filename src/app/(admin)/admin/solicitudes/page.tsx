'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { User } from '@/types/database'

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const supabase = createClient()

  // Cargar solicitudes pendientes al abrir la página
  useEffect(() => {
    loadSolicitudes()
  }, [])

  async function loadSolicitudes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('account_status', 'pending')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSolicitudes(data)
    }
    setLoading(false)
  }

async function handleApprove(userId: string) {
    setApproving(userId)

    // Buscar datos del usuario para el email
    const userToApprove = solicitudes.find(s => s.id === userId)

    // Actualizar el estado de la cuenta a 'approved'
    const { error } = await supabase
      .from('users')
      .update({
        account_status: 'approved',
        joined_at: new Date().toISOString().split('T')[0],
      })
      .eq('id', userId)

    if (!error) {
      // Enviar email de aprobación
      if (userToApprove) {
        await fetch('/api/email/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userToApprove.email,
            firstName: userToApprove.first_name,
          }),
        })
      }

      // Quitar la solicitud de la lista
      setSolicitudes(prev => prev.filter(s => s.id !== userId))
    }

    setApproving(null)
  }

  // Formatear fecha para mostrarla legible
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Solicitudes pendientes</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {loading
              ? 'Cargando...'
              : `${solicitudes.length} solicitud${solicitudes.length !== 1 ? 'es' : ''} pendiente${solicitudes.length !== 1 ? 's' : ''}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && solicitudes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay solicitudes pendientes en este momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Fecha solicitud</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell className="font-medium">
                        {solicitud.first_name} {solicitud.last_name}
                      </TableCell>
                      <TableCell>{solicitud.email}</TableCell>
                      <TableCell>{solicitud.identification}</TableCell>
                      <TableCell>{solicitud.phone}</TableCell>
                      <TableCell>{formatDate(solicitud.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(solicitud.id)}
                          disabled={approving === solicitud.id}
                        >
                          {approving === solicitud.id
                            ? 'Aprobando...'
                            : 'Aprobar'
                          }
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}