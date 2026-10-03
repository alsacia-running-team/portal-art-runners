-- 1) Políticas de INSERT que la app no usa (registro y pagos se crean desde el servidor
--    con service_role) y que permitían crear perfiles admin o pagos falsos.
drop policy if exists "Usuario puede crear su propio perfil" on public.users;
drop policy if exists "Usuario puede crear sus propios pagos" on public.payments;

-- 2) "Usuario edita su propio perfil" no restringe columnas. Este trigger limita a los
--    miembros a sus datos personales; admins, service_role y el SQL editor no se ven afectados.
create or replace function public.protect_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_editable text[] := array[
    'first_name', 'last_name', 'phone', 'gender', 'birth_date', 'identification'
  ];
begin
  if coalesce(auth.role(), '') <> 'authenticated' or public.is_admin() then
    return new;
  end if;

  if (to_jsonb(new) - v_member_editable) is distinct from (to_jsonb(old) - v_member_editable) then
    raise exception 'No tienes permiso para modificar estos campos'
      using errcode = '42501';
  end if;

  -- La identificación solo se puede registrar una vez.
  if nullif(old.identification, '') is not null
     and new.identification is distinct from old.identification then
    raise exception 'La identificación ya fue registrada y no se puede cambiar'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_user_columns on public.users;
create trigger protect_user_columns
  before update on public.users
  for each row execute function public.protect_user_columns();
