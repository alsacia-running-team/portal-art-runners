-- complete_wompi_payment es security definer y quedó ejecutable por PUBLIC/anon/authenticated,
-- lo que permitía a cualquier usuario registrar un pago sin pagar vía /rest/v1/rpc.
-- Solo el servidor (service_role) debe poder invocarla.

revoke execute on function public.complete_wompi_payment(uuid, text, text, timestamptz)
  from public, anon, authenticated;

grant execute on function public.complete_wompi_payment(uuid, text, text, timestamptz)
  to service_role;

-- payment_intents solo se usa desde el servidor con service_role (que ignora RLS).
-- Activar RLS sin políticas bloquea el acceso directo con la anon key.
alter table public.payment_intents enable row level security;
