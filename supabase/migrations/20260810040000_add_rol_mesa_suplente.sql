-- Rol de mesa: un titular por mesa; el resto queda como suplente
-- (reasignación posterior al mismo centro de votación).

create type public.rol_mesa as enum ('titular', 'suplente');

alter table public.registros
  add column rol_mesa public.rol_mesa not null default 'titular';

comment on column public.registros.rol_mesa is
  'titular = personero asignado a numero_mesa; suplente = mesa ya tomada, pendiente de reasignación en el mismo centro.';

create index registros_origen_mesa_idx
  on public.registros (origen, numero_mesa)
  where numero_mesa is not null;
