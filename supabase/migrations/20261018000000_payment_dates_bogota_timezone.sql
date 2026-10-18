-- Las fechas de pago se calculaban en UTC: un pago hecho después de las 7:00 p. m.
-- (hora Colombia) quedaba registrado con la fecha del día siguiente y corría
-- también el próximo pago. La plataforma opera en hora de Bogotá.
--
-- Además, al renovar antes de la fecha de pago, period_start quedaba en la fecha
-- del pago en vez de la fecha en que empieza el nuevo período (v_base_date),
-- lo que hacía que los períodos se solaparan en el historial.

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
  v_today date := (p_paid_at at time zone 'America/Bogota')::date;
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
    set last_payment_date = coalesce((v_existing.paid_at at time zone 'America/Bogota')::date, v_today),
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
    v_base_date,
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

-- create or replace conserva los permisos, pero se reafirman por seguridad.
revoke execute on function public.complete_wompi_payment(uuid, text, text, timestamptz)
  from public, anon, authenticated;

grant execute on function public.complete_wompi_payment(uuid, text, text, timestamptz)
  to service_role;
