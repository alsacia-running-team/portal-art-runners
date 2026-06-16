-- Nuevos campos del formulario de registro (cuestionario) y ajuste de identificación.
-- La identificación deja de pedirse en el registro: el miembro la completa en su
-- perfil después de ser aprobado, por eso pasa a ser opcional a nivel de columna.

alter table public.users
  alter column identification drop not null;

alter table public.users
  add column if not exists interested_plan text
    check (interested_plan in ('grupal', 'personalizado')),
  add column if not exists lives_in_alsacia boolean,
  add column if not exists training_level text
    check (training_level in ('A', 'B', 'C', 'D')),
  add column if not exists training_goal text
    check (training_goal in ('salud', 'peso', 'rendimiento', 'social')),
  add column if not exists strength_training text
    check (strength_training in ('no', 'gimnasio', 'casa'));

comment on column public.users.interested_plan is
  'Plan que le interesa al solicitante: grupal | personalizado.';
comment on column public.users.lives_in_alsacia is
  'Si vive en el sector de Ciudad Alsacia, Bogotá o alrededores.';
comment on column public.users.training_level is
  'Nivel de entrenamiento declarado: A | B | C | D.';
comment on column public.users.training_goal is
  'Objetivo principal de entrenamiento: salud | peso | rendimiento | social.';
comment on column public.users.strength_training is
  'Entrenamiento de fuerza actual: no | gimnasio | casa.';
