create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  reference text not null,
  amount_in_cents integer not null check (amount_in_cents > 0),
  currency text not null default 'COP',
  status text not null default 'created'
    check (status in ('created', 'pending', 'approved', 'declined', 'voided', 'error')),
  wompi_transaction_id text,
  expires_at timestamptz not null default now() + interval '2 hours',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_intents_reference_key
on public.payment_intents(reference);

create index if not exists payment_intents_user_id_idx
on public.payment_intents(user_id);

create unique index if not exists payments_wompi_transaction_id_key
on public.payments(wompi_transaction_id)
where wompi_transaction_id is not null;

create or replace function public.complete_wompi_payment(
  p_intent_id uuid,
  p_transaction_id text,
  p_payment_method text,
  p_paid_at timestamptz default now()
)
returns table (
  status text,
  transaction_id text,
  next_payment_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intent public.payment_intents%rowtype;
  v_user public.users%rowtype;
  v_plan public.plans%rowtype;
  v_existing public.payments%rowtype;
  v_today date := (p_paid_at at time zone 'UTC')::date;
  v_base_date date;
  v_next_payment_date date;
  v_amount_cop integer;
begin
  select *
  into v_intent
  from public.payment_intents
  where id = p_intent_id
  for update;

  if not found then
    raise exception 'Payment intent not found';
  end if;

  select *
  into v_user
  from public.users
  where id = v_intent.user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  select *
  into v_plan
  from public.plans
  where id = v_intent.plan_id;

  if not found then
    raise exception 'Plan not found';
  end if;

  select *
  into v_existing
  from public.payments
  where wompi_transaction_id = p_transaction_id;

  if found then
    update public.payment_intents
    set status = 'approved',
        wompi_transaction_id = p_transaction_id,
        updated_at = now()
    where id = v_intent.id;

    update public.users
    set last_payment_date = coalesce((v_existing.paid_at at time zone 'UTC')::date, v_today),
        next_payment_date = v_existing.period_end
    where id = v_user.id;

    return query select 'APPROVED'::text, p_transaction_id, v_existing.period_end;
    return;
  end if;

  v_base_date := case
    when v_user.next_payment_date is not null and v_user.next_payment_date > v_today
      then v_user.next_payment_date
    else v_today
  end;

  if v_plan.frequency = 'trimestral' then
    v_next_payment_date := (v_base_date + interval '3 months')::date;
  else
    v_next_payment_date := (v_base_date + interval '1 month')::date;
  end if;

  v_amount_cop := v_intent.amount_in_cents / 100;

  insert into public.payments (
    user_id,
    plan_id,
    amount_cop,
    status,
    payment_method,
    wompi_transaction_id,
    period_start,
    period_end,
    paid_at
  )
  values (
    v_user.id,
    v_plan.id,
    v_amount_cop,
    'completed',
    coalesce(lower(p_payment_method), 'wompi'),
    p_transaction_id,
    v_today,
    v_next_payment_date,
    p_paid_at
  );

  update public.users
  set last_payment_date = v_today,
      next_payment_date = v_next_payment_date
  where id = v_user.id;

  update public.payment_intents
  set status = 'approved',
      wompi_transaction_id = p_transaction_id,
      updated_at = now()
  where id = v_intent.id;

  return query select 'APPROVED'::text, p_transaction_id, v_next_payment_date;
end;
$$;
