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

    if (!error && data) setClients(data as UserWithPlan[])
    setLoading(false)
  }

  async function loadPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
    if (data) setPlans(data)
  }

  function getPaymentStatus(client: User): 'al_dia' | 'pendiente' {
    if (client.is_courtesy) return 'al_dia'
    if (!client.next_payment_date) return 'pendiente'
    const today = new Date()
    const nextPayment = new Date(client.next_payment_date)
    return today > nextPayment ? 'pendiente' : 'al_dia'
  }

  function formatPrice(amount: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
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
      setClients(prev =>
        prev.map(c =>
          c.id === client.id ? { ...c, account_status: newStatus } : c
        )
      )
    }
  }

  const filteredClients = clients.filter((client) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      search === '' ||
      client.first_name.toLowerCase().includes(searchLower) ||
      client.last_name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.identification.includes(search)

    const matchesStatus =
      filterStatus === 'all' || client.account_status === filterStatus

    const matchesPlan =
      filterPlan === 'all' ||
      (filterPlan === 'sin_plan' && !client.plan_id) ||
      (client.plans && `${client.plans.name}-${client.plans.frequency}` === filterPlan)

    const paymentStatus = getPaymentStatus(client)
    const matchesPayment =
      filterPayment === 'all' || paymentStatus === filterPayment

    return matchesSearch && matchesStatus && matchesPlan && matchesPayment
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 mt-1">Gestiona los miembros del equipo</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6 border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar nombre, correo o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-gray-200"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-11 border-gray-200">
                <SelectValue placeholder="Estado de cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="approved">Activos</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="h-11 border-gray-200">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={`${plan.name}-${plan.frequency}`}>
                    {plan.name} ({plan.frequency})
                  </SelectItem>
                ))}
                <SelectItem value="sin_plan">Sin plan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="h-11 border-gray-200">
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

      {/* Tabla */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-alsacia-blue-500">
            {loading ? 'Cargando...' : `${filteredClients.length} cliente${filteredClients.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No se encontraron clientes con esos filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Acciones</TableHead>
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
                        <TableCell className="text-gray-500">{client.email}</TableCell>
                        <TableCell>
                          {client.plans
                            ? <span className="text-sm">{client.plans.name} ({client.plans.frequency})</span>
                            : <span className="text-gray-400 text-sm">Sin plan</span>
                          }
                        </TableCell>
                        <TableCell>
                          {client.plans
                            ? <span className="text-sm font-medium">{formatPrice(client.custom_price_cop ?? client.plans.price_cop)}</span>
                            : <span className="text-gray-400">—</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              client.account_status === 'approved'
                                ? 'bg-alsacia-cyan-100 text-alsacia-cyan-700 hover:bg-alsacia-cyan-100'
                                : 'bg-alsacia-pink-100 text-alsacia-pink-700 hover:bg-alsacia-pink-100'
                            }`}
                          >
                            {client.account_status === 'approved' ? 'Activo' : 'Suspendido'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              paymentStatus === 'al_dia'
                                ? 'bg-alsacia-cyan-100 text-alsacia-cyan-700 hover:bg-alsacia-cyan-100'
                                : 'bg-alsacia-yellow-100 text-alsacia-yellow-700 hover:bg-alsacia-yellow-100'
                            }`}
                          >
                            {paymentStatus === 'al_dia' ? 'Al día' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-alsacia-blue-500 border-alsacia-blue-200 hover:bg-alsacia-blue-50"
                              onClick={() => router.push(`/admin/clientes/${client.id}`)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant={client.account_status === 'approved' ? 'destructive' : 'default'}
                              className={client.account_status === 'approved'
                                ? 'bg-alsacia-pink-500 hover:bg-alsacia-pink-600'
                                : 'bg-alsacia-cyan-500 hover:bg-alsacia-cyan-600'
                              }
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