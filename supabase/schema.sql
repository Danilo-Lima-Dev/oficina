-- =====================================================================
--  Sistema da Tapeçaria – banco de dados no Supabase
--  Como usar: Supabase → SQL Editor → New query → cole TODO este arquivo → Run.
--  Pode rodar de novo sem perder dados (cada parte só cria o que falta).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Tabelas
--    Cada registro guarda os campos do sistema em "dados" (formato JSON),
--    o mesmo formato que as telas já usam.
-- ---------------------------------------------------------------------
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
create unique index if not exists perfis_login_unico on public.perfis (lower(dados->>'login'));

create table if not exists public.publico (   -- nome e logo da empresa (aparecem na tela de login)
  id int primary key default 1 check (id = 1),
  nome text not null default 'Tapeçaria',
  logo text not null default ''
);
insert into public.publico (id) values (1) on conflict do nothing;

do $$
declare t text;
begin
  foreach t in array array['config','clientes','veiculos','produtos','categorias','movs','orcamentos','os','caixa','logs'] loop
    execute format('create table if not exists public.%I (
      id text primary key,
      dados jsonb not null,
      criado_em timestamptz not null default now(),
      atualizado_em timestamptz not null default now(),
      atualizado_por uuid default auth.uid()
    )', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
alter table public.perfis enable row level security;
alter table public.publico enable row level security;

create index if not exists caixa_os on public.caixa ((dados->>'osId'));
create index if not exists logs_data on public.logs ((dados->>'data'));

create sequence if not exists public.seq_os;
create sequence if not exists public.seq_orc;

-- ---------------------------------------------------------------------
-- 2. Quem pode o quê
--    pode('os.editar') = o usuário logado está ativo e é administrador
--    ou tem essa função liberada na tela Acessos.
-- ---------------------------------------------------------------------
create or replace function public.ativo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and coalesce((dados->>'ativo')::boolean, false));
$$;

create or replace function public.pode(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfis
    where id = auth.uid()
      and coalesce((dados->>'ativo')::boolean, false)
      and (coalesce((dados->>'admin')::boolean, false) or coalesce((dados->'perms'->>p)::boolean, false))
  );
$$;

-- recria as regras do zero (permite rodar o arquivo de novo)
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
           and tablename in ('perfis','publico','config','clientes','veiculos','produtos','categorias','movs','orcamentos','os','caixa','logs') loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Nome e logo: qualquer pessoa vê (tela de login); só quem altera a empresa muda
create policy publico_ver    on public.publico for select to anon, authenticated using (true);
create policy publico_mudar  on public.publico for update to authenticated using (pode('config')) with check (pode('config'));

-- Configurações da empresa
create policy config_ver     on public.config for select to authenticated using (ativo());
create policy config_criar   on public.config for insert to authenticated with check (pode('config'));
create policy config_mudar   on public.config for update to authenticated using (pode('config')) with check (pode('config'));

-- Clientes (dados pessoais)
create policy cli_ver        on public.clientes for select to authenticated using (pode('cli.ver'));
create policy cli_criar      on public.clientes for insert to authenticated with check (pode('cli.editar'));
create policy cli_mudar      on public.clientes for update to authenticated using (pode('cli.editar') or pode('cli.lgpd')) with check (pode('cli.editar') or pode('cli.lgpd'));
create policy cli_apagar     on public.clientes for delete to authenticated using (pode('config'));

-- Veículos
create policy vei_ver        on public.veiculos for select to authenticated using (pode('vei.ver') or pode('os.ver') or pode('orc.ver'));
create policy vei_criar      on public.veiculos for insert to authenticated with check (pode('vei.editar'));
create policy vei_mudar      on public.veiculos for update to authenticated using (pode('vei.editar') or pode('vei.excluir') or pode('cli.lgpd')) with check (pode('vei.editar') or pode('vei.excluir') or pode('cli.lgpd'));
create policy vei_apagar     on public.veiculos for delete to authenticated using (pode('config'));

-- Estoque
create policy prod_ver       on public.produtos for select to authenticated using (pode('est.ver') or pode('orc.ver') or pode('os.ver'));
create policy prod_criar     on public.produtos for insert to authenticated with check (pode('est.editar'));
create policy prod_mudar     on public.produtos for update to authenticated using (pode('est.editar') or pode('est.movimentar') or pode('os.editar')) with check (pode('est.editar') or pode('est.movimentar') or pode('os.editar'));
create policy prod_apagar    on public.produtos for delete to authenticated using (pode('est.excluir'));

create policy cat_ver        on public.categorias for select to authenticated using (pode('est.ver') or pode('orc.ver') or pode('os.ver'));
create policy cat_criar      on public.categorias for insert to authenticated with check (pode('est.editar'));
create policy cat_mudar      on public.categorias for update to authenticated using (pode('est.editar')) with check (pode('est.editar'));
create policy cat_apagar     on public.categorias for delete to authenticated using (pode('est.excluir') or pode('est.editar'));

create policy mov_ver        on public.movs for select to authenticated using (pode('est.ver'));
create policy mov_criar      on public.movs for insert to authenticated with check (pode('est.movimentar') or pode('est.editar') or pode('os.editar'));
create policy mov_mudar      on public.movs for update to authenticated using (pode('est.excluir') or pode('est.editar')) with check (pode('est.excluir') or pode('est.editar'));
create policy mov_apagar     on public.movs for delete to authenticated using (pode('config'));

-- Orçamentos e ordens de serviço
create policy orc_ver        on public.orcamentos for select to authenticated using (pode('orc.ver'));
create policy orc_criar      on public.orcamentos for insert to authenticated with check (pode('orc.editar'));
create policy orc_mudar      on public.orcamentos for update to authenticated using (pode('orc.editar') or pode('orc.aprovar')) with check (pode('orc.editar') or pode('orc.aprovar'));
create policy orc_apagar     on public.orcamentos for delete to authenticated using (pode('orc.excluir'));

create policy os_ver         on public.os for select to authenticated using (pode('os.ver'));
create policy os_criar       on public.os for insert to authenticated with check (pode('os.editar') or pode('orc.aprovar'));
create policy os_mudar       on public.os for update to authenticated using (pode('os.editar') or pode('orc.aprovar')) with check (pode('os.editar') or pode('orc.aprovar'));
create policy os_apagar      on public.os for delete to authenticated using (pode('os.excluir'));

-- Caixa: o caixa completo só para quem tem "Ver o caixa completo".
-- Quem vê valores ou recebe pagamentos enxerga apenas os pagamentos ligados a OS.
create policy cx_ver         on public.caixa for select to authenticated using (
  pode('caixa.ver') or ((pode('precos') or pode('caixa.receber')) and coalesce(dados->>'osId','') <> ''));
create policy cx_criar       on public.caixa for insert to authenticated with check (
  pode('caixa.lancar') or (pode('caixa.receber') and coalesce(dados->>'osId','') <> '' and dados->>'tipo' = 'entrada'));
create policy cx_apagar      on public.caixa for delete to authenticated using (pode('caixa.excluir'));

-- Auditoria: todos registram, só quem tem a função vê; ninguém altera nem apaga
create policy log_ver        on public.logs for select to authenticated using (pode('auditoria'));
create policy log_criar      on public.logs for insert to authenticated with check (auth.uid() is not null);

-- Usuários: cada um vê o próprio cadastro; quem gerencia acessos vê e altera todos
create policy perf_ver       on public.perfis for select to authenticated using (id = auth.uid() or pode('acessos') or pode('auditoria'));
create policy perf_mudar     on public.perfis for update to authenticated using (id = auth.uid() or pode('acessos')) with check (id = auth.uid() or pode('acessos'));

-- Quem não gerencia acessos só pode mudar no próprio cadastro o último acesso e a troca de senha
create or replace function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not pode('acessos') then
    new.dados := old.dados || jsonb_strip_nulls(jsonb_build_object(
      'ultimoAcesso', new.dados->'ultimoAcesso',
      'trocarSenha',  new.dados->'trocarSenha'));
  end if;
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists proteger_perfil on public.perfis;
create trigger proteger_perfil before update on public.perfis for each row execute function public.proteger_perfil();

-- Marca quem alterou e quando
create or replace function public.marcar_alteracao() returns trigger
language plpgsql as $$
begin new.atualizado_em := now(); new.atualizado_por := auth.uid(); return new; end $$;
do $$
declare t text;
begin
  foreach t in array array['config','clientes','veiculos','produtos','categorias','movs','orcamentos','os','caixa'] loop
    execute format('drop trigger if exists marcar_alteracao on public.%I', t);
    execute format('create trigger marcar_alteracao before update on public.%I for each row execute function public.marcar_alteracao()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. Usuários
--    Todo usuário criado no Supabase ganha um cadastro BLOQUEADO e sem funções.
--    O PRIMEIRO usuário vira administrador. Depois disso, só o administrador
--    libera acessos na tela Acessos.
-- ---------------------------------------------------------------------
create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  primeiro boolean := not exists (select 1 from perfis);
  base text := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'login', split_part(new.email, '@', 1)), '[^a-z0-9._-]', '', 'gi'));
  lg text;
begin
  if base is null or length(base) < 3 then base := 'usuario'; end if;
  lg := base;
  if exists (select 1 from perfis where lower(dados->>'login') = lg) then lg := base || '-' || substr(new.id::text, 1, 4); end if;
  insert into perfis (id, dados) values (new.id, jsonb_build_object(
    'nome', coalesce(nullif(new.raw_user_meta_data->>'nome', ''), split_part(new.email, '@', 1)),
    'login', lg,
    'email', new.email,
    'admin', primeiro,
    'ativo', primeiro,
    'perms', '{}'::jsonb,
    'trocarSenha', false,
    'criado', to_char(now() at time zone 'America/Fortaleza', 'YYYY-MM-DD'),
    'ultimoAcesso', ''));
  return new;
end $$;
drop trigger if exists novo_usuario on auth.users;
create trigger novo_usuario after insert on auth.users for each row execute function public.novo_usuario();

-- Tela de login: o sistema ainda não tem usuários? (mostra "Criar administrador")
create or replace function public.sistema_vazio() returns boolean
language sql stable security definer set search_path = public as $$ select not exists (select 1 from perfis); $$;

-- Login pelo nome de usuário: devolve o e-mail para o Supabase autenticar
create or replace function public.email_do_login(p_login text) returns text
language sql stable security definer set search_path = public as $$
  select dados->>'email' from perfis
  where lower(dados->>'login') = lower(trim(p_login)) and coalesce((dados->>'ativo')::boolean, false)
  limit 1;
$$;

-- Administrador define a senha de outra pessoa (senha temporária ou nova)
create or replace function public.admin_definir_senha(p_id uuid, p_senha text) returns void
language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if not pode('acessos') then raise exception 'Sem permissão para alterar senhas.'; end if;
  if length(coalesce(p_senha, '')) < 8 then raise exception 'A senha precisa ter pelo menos 8 caracteres.'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now() where id = p_id;
end $$;

-- Administrador troca o e-mail de acesso de outra pessoa
create or replace function public.admin_alterar_email(p_id uuid, p_email text) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not pode('acessos') then raise exception 'Sem permissão para alterar usuários.'; end if;
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  update auth.users set email = lower(p_email), email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = p_id;
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', lower(p_email)) where user_id = p_id and provider = 'email';
  update perfis set dados = dados || jsonb_build_object('email', lower(p_email)) where id = p_id;
end $$;

-- Administrador exclui um usuário (o histórico da auditoria continua)
create or replace function public.admin_excluir_usuario(p_id uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not pode('acessos') then raise exception 'Sem permissão para excluir usuários.'; end if;
  if p_id = auth.uid() then raise exception 'Você não pode excluir o próprio usuário.'; end if;
  delete from auth.users where id = p_id;
end $$;

-- ---------------------------------------------------------------------
-- 4. Numeração de OS e orçamentos (sem repetir, mesmo com várias pessoas ao mesmo tempo)
-- ---------------------------------------------------------------------
create or replace function public.proximo_numero(p_tipo text) returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if p_tipo = 'os' and (pode('os.editar') or pode('orc.aprovar')) then return nextval('seq_os'); end if;
  if p_tipo = 'orc' and pode('orc.editar') then return nextval('seq_orc'); end if;
  raise exception 'Sem permissão para criar este documento.';
end $$;

-- Acerta a numeração depois de carregar ou apagar dados de teste
create or replace function public.ajustar_numeracao() returns void
language plpgsql security definer set search_path = public as $$
declare m bigint;
begin
  if not pode('config') then raise exception 'Sem permissão.'; end if;
  select max((dados->>'num')::bigint) into m from os;
  if m is null then perform setval('seq_os', 1, false); else perform setval('seq_os', m, true); end if;
  select max((dados->>'num')::bigint) into m from orcamentos;
  if m is null then perform setval('seq_orc', 1, false); else perform setval('seq_orc', m, true); end if;
end $$;

-- Quem não pode ver dados pessoais recebe só o nome abreviado do cliente (ex.: "João S.")
create or replace function public.clientes_resumo() returns table (id text, nome text)
language sql stable security definer set search_path = public as $$
  select c.id,
         split_part(c.dados->>'nome', ' ', 1) ||
         case when position(' ' in trim(c.dados->>'nome')) > 0
              then ' ' || left(regexp_replace(trim(c.dados->>'nome'), '^.* ', ''), 1) || '.' else '' end
  from clientes c where ativo();
$$;

-- ---------------------------------------------------------------------
-- 5. Acesso das funções e atualização em tempo real entre aparelhos
-- ---------------------------------------------------------------------
revoke all on function public.admin_definir_senha(uuid, text), public.admin_alterar_email(uuid, text),
  public.admin_excluir_usuario(uuid), public.proximo_numero(text), public.ajustar_numeracao(), public.clientes_resumo() from public, anon;
grant execute on function public.admin_definir_senha(uuid, text), public.admin_alterar_email(uuid, text),
  public.admin_excluir_usuario(uuid), public.proximo_numero(text), public.ajustar_numeracao(), public.clientes_resumo() to authenticated;
grant execute on function public.sistema_vazio(), public.email_do_login(text) to anon, authenticated;
grant usage on sequence public.seq_os, public.seq_orc to authenticated;

do $$
declare t text;
begin
  foreach t in array array['perfis','publico','config','clientes','veiculos','produtos','categorias','movs','orcamentos','os','caixa'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object or undefined_object then null;
    end;
  end loop;
end $$;
