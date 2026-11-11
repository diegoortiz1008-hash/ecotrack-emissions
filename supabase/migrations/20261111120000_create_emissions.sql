-- Tabla que consume el Dashboard de Emisiones
create table if not exists public.emissions (
  id           uuid primary key default gen_random_uuid(),
  source_name  text not null check (char_length(trim(source_name)) between 3 and 80),
  category     text not null check (category in ('transporte', 'energia', 'residuos')),
  co2_kg       numeric(12, 2) not null check (co2_kg > 0 and co2_kg <= 1000000),
  created_at   timestamptz not null default now()
);

create index if not exists emissions_created_at_idx on public.emissions (created_at desc);

alter table public.emissions enable row level security;

-- Laboratorio: lectura e inserción con la anon key (sin login).
-- En producción cambiar `to anon, authenticated` por `to authenticated` y filtrar por empresa.
create policy "emissions: lectura publica" on public.emissions
  for select to anon, authenticated using (true);

create policy "emissions: insercion publica" on public.emissions
  for insert to anon, authenticated with check (true);

-- Habilitar Realtime para la tabla (eventos INSERT)
alter publication supabase_realtime add table public.emissions;
