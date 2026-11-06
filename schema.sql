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

-- Página da dona (caixa.html): só devolve as privadas para quem tem a chave do link.
-- Aqui fica apenas a impressão digital (SHA-256) da chave, nunca a chave.
create or replace function public.mensagens_privadas(chave text)
returns table (id bigint, nome text, texto text, criado_em timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.nome, m.texto, m.criado_em
  from public.mensagens m
  where m.publica = false
    and sha256(convert_to(chave, 'UTF8')) =
        '\xd3be698004544c7b50141bd49d86af5a6f4a1fe3cc2466f2e440a3fb5738d0e6'::bytea
  order by m.criado_em desc;
$$;

revoke all on function public.mensagens_privadas(text) from public;
grant execute on function public.mensagens_privadas(text) to anon;
