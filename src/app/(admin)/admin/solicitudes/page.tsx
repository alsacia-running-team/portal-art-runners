'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

    if (!error && data) setSolicitudes(data)
    setLoading(false)
  }

  async function handleApprove(userId: string) {
    setApproving(userId)

    const userToApprove = solicitudes.find(s => s.id === userId)

    const { error } = await supabase
      .from('users')
      .update({
        account_status: 'approved',
        joined_at: new Date().toISOString().split('T')[0],
      })
      .eq('id', userId)

    if (!error) {
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
      setSolicitudes(prev => prev.filter(s => s.id !== userId))
    }

    setApproving(null)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Solicitudes</h1>
        <p className="text-gray-500 mt-1">Aprueba las cuentas de nuevos miembros</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-alsacia-blue-500">
            {loading
              ? 'Cargando...'
              : `${solicitudes.length} solicitud${solicitudes.length !== 1 ? 'es' : ''} pendiente${solicitudes.length !== 1 ? 's' : ''}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && solicitudes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-alsacia-cyan-50 mb-4">
                <svg className="w-7 h-7 text-alsacia-cyan-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-400">No hay solicitudes pendientes en este momento.</p>
            </div>
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
                      <TableCell className="text-gray-500">{solicitud.email}</TableCell>
                      <TableCell>{solicitud.identification}</TableCell>
                      <TableCell>{solicitud.phone}</TableCell>
                      <TableCell className="text-gray-500">{formatDate(solicitud.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="bg-alsacia-cyan-500 hover:bg-alsacia-cyan-600 text-white"
                          onClick={() => handleApprove(solicitud.id)}
                          disabled={approving === solicitud.id}
                        >
                          {approving === solicitud.id ? 'Aprobando...' : 'Aprobar'}
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