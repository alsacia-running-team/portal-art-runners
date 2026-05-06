import { createAdminClient } from '@/lib/supabase/admin'
import type { WompiTransaction } from '@/lib/payments/wompi'

export type PaymentIntent = {
  id: string
  user_id: string
  plan_id: string
  reference: string
  amount_in_cents: number
  currency: string
  status: string
  wompi_transaction_id: string | null
}

export type CompletedPayment = {
  status: string
  transactionId: string
  nextPaymentDate: string | null
}

function normalizeWompiStatus(status: string) {
  return status.toLowerCase()
}

export async function findPaymentIntentByReference(reference: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('reference', reference)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as PaymentIntent | null
}

export async function markPaymentIntentStatus({
  intentId,
  transactionId,
  status,
}: {
  intentId: string
  transactionId: string
  status: string
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('payment_intents')
    .update({
      status: normalizeWompiStatus(status),
      wompi_transaction_id: transactionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', intentId)

  if (error) {
    throw error
  }
}

export async function completeApprovedPayment({
  intent,
  transaction,
}: {
  intent: PaymentIntent
  transaction: WompiTransaction
}): Promise<CompletedPayment> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('complete_wompi_payment', {
    p_intent_id: intent.id,
    p_transaction_id: transaction.id,
    p_payment_method: transaction.payment_method_type ?? 'wompi',
    p_paid_at: new Date().toISOString(),
  })

  if (error) {
    throw error
  }

  const completed = Array.isArray(data) ? data[0] : data

  return {
    status: completed?.status ?? 'APPROVED',
    transactionId: completed?.transaction_id ?? transaction.id,
    nextPaymentDate: completed?.next_payment_date ?? null,
  }
}

export async function validateTransactionMatchesIntent({
  intent,
  transaction,
}: {
  intent: PaymentIntent
  transaction: WompiTransaction
}) {
  return (
    transaction.reference === intent.reference &&
    transaction.amount_in_cents === intent.amount_in_cents &&
    transaction.currency === intent.currency
  )
}
