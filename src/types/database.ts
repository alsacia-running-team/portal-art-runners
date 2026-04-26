export type Plan = {
  id: string
  name: string
  frequency: 'mensual' | 'trimestral'
  price_cop: number
  is_active: boolean
  created_at: string
}

export type User = {
  id: string
  auth_id: string
  email: string
  first_name: string
  last_name: string
  identification: string
  phone: string
  gender: 'masculino' | 'femenino' | 'otro'
  birth_date: string
  photo_url: string | null
  role: 'member' | 'admin'
  account_status: 'pending' | 'approved' | 'suspended'
  plan_id: string | null
  is_courtesy: boolean
  joined_at: string | null
  cutoff_date: string | null
  last_payment_date: string | null
  next_payment_date: string | null
  created_at: string
}

export type Payment = {
  id: string
  user_id: string
  plan_id: string
  amount_cop: number
  status: 'pending' | 'completed' | 'failed'
  payment_method: string | null
  wompi_transaction_id: string | null
  period_start: string | null
  period_end: string | null
  paid_at: string | null
  created_at: string
}