'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { User, Plan } from '@/types/database'

type UserWithPlan = User & { plans: Plan | null }

export default function ClientesPage() {
  const [clients, setClients] = useState<UserWithPlan[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadClients()
    loadPlans()
  }, [])

  async function loadClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*, plans(*)')
      .eq('role', 'member')
      .neq('account_status', 'pending')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setClients(data as UserWithPlan[])
    }
    setLoading(false)
  }

  async function loadPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)

    if (data) setPlans(data)
  }

  // Calcular estado de pago de un cliente
  function getPaymentStatus(client: User): 'al_dia' | 'pendiente' {
    if (client.is_courtesy) return 'al_dia'
    if (!client.next_payment_date) return 'pendiente'

    const today = new Date()
    const nextPayment = new Date(client.next_payment_date)
    return today > nextPayment ? 'pendiente' : 'al_dia'
  }

  async function handleToggleStatus(client: UserWithPlan) {
    const newStatus = client.account_status === 'approved' ? 'suspended' : 'approved'
    const confirmMsg = newStatus === 'suspended'
      ? `¿Seguro que quieres suspender a ${client.first_name} ${client.last_name}?`
      : `¿Seguro que quieres activar a ${client.first_name} ${client.last_name}?`

    if (!confirm(confirmMsg)) return

    const { error } = await supabase
      .from('users')
      .update({ account_status: newStatus })
      .eq('id', client.id)

    if (!error) {
      // Actualizar la lista sin recargar la página
      setClients(prev =>
        prev.map(c =>
          c.id === client.id ? { ...c, account_status: newStatus } : c
        )
      )
    }
  }

  // Aplicar filtros y búsqueda
  const filteredClients = clients.filter((client) => {
    // Filtro de búsqueda por nombre, apellido, email o identificación
    const searchLower = search.toLowerCase()
    const matchesSearch =
      search === '' ||
      client.first_name.toLowerCase().includes(searchLower) ||
      client.last_name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.identification.includes(search)

    // Filtro por estado de cuenta
    const matchesStatus =
      filterStatus === 'all' || client.account_status === filterStatus

    // Filtro por plan
    const matchesPlan =
      filterPlan === 'all' ||
      (client.plans && `${client.plans.name}-${client.plans.frequency}` === filterPlan)

    // Filtro por estado de pago
    const paymentStatus = getPaymentStatus(client)
    const matchesPayment =
      filterPayment === 'all' || paymentStatus === filterPayment

    return matchesSearch && matchesStatus && matchesPlan && matchesPayment
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      {/* Barra de filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por nombre, correo o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="approved">Activos</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                {plans.map((plan) => (
                  <SelectItem
                    key={plan.id}
                    value={`${plan.name}-${plan.frequency}`}
                  >
                    {plan.name} ({plan.frequency})
                  </SelectItem>
                ))}
                <SelectItem value="sin_plan">Sin plan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="al_dia">Al día</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {loading ? 'Cargando...' : `${filteredClients.length} cliente${filteredClients.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && filteredClients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No se encontraron clientes con esos filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const paymentStatus = getPaymentStatus(client)
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.first_name} {client.last_name}
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>
                          {client.plans
                            ? `${client.plans.name} (${client.plans.frequency})`
                            : <span className="text-gray-400">Sin plan</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={client.account_status === 'approved' ? 'default' : 'destructive'}
                          >
                            {client.account_status === 'approved' ? 'Activo' : 'Suspendido'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={paymentStatus === 'al_dia' ? 'default' : 'destructive'}
                            className={paymentStatus === 'al_dia' ? 'bg-green-600' : ''}
                          >
                            {paymentStatus === 'al_dia' ? 'Al día' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                          <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/clientes/${client.id}`)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant={client.account_status === 'approved' ? 'destructive' : 'default'}
                              onClick={() => handleToggleStatus(client)}
                            >
                              {client.account_status === 'approved' ? 'Suspender' : 'Activar'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}