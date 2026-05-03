alter table public.users
add column if not exists custom_price_cop integer;

comment on column public.users.custom_price_cop is
'Precio COP personalizado que se cobra a este miembro para su plan asignado. Si es null, la app usa plans.price_cop como respaldo.';
