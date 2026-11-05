-- Rode no SQL Editor do Supabase. Pode rodar de novo sem problema.
create table if not exists public.mensagens (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 1 and 30),
  texto text not null check (char_length(texto) between 1 and 280),
  publica boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.mensagens add column if not exists publica boolean not null default false;

alter table public.mensagens enable row level security;

-- Visitantes só leem mensagens públicas e não podem editar nem apagar nada.
-- As privadas aparecem apenas para você, no Table Editor do Supabase.
drop policy if exists "mural_ler" on public.mensagens;
create policy "mural_ler" on public.mensagens
  for select to anon using (publica = true);

drop policy if exists "mural_escrever" on public.mensagens;
create policy "mural_escrever" on public.mensagens
  for insert to anon with check (true);

-- Lista de presença: pública para leitura, cada nome entra uma vez.
create table if not exists public.confirmados (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 1 and 30),
  chave text not null unique check (char_length(chave) between 1 and 30),
  criado_em timestamptz not null default now()
);

alter table public.confirmados enable row level security;

drop policy if exists "presenca_ler" on public.confirmados;
create policy "presenca_ler" on public.confirmados
  for select to anon using (true);

drop policy if exists "presenca_confirmar" on public.confirmados;
create policy "presenca_confirmar" on public.confirmados
  for insert to anon with check (true);
