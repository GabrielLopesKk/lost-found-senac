create extension if not exists pgcrypto with schema extensions;
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create or replace function public.gen_ref(prefix text, len int)
returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(len);
  result text := '';
  i int;
begin
  for i in 0..len - 1 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  if prefix = '' then return result; end if;
  return prefix || '-' || result;
end; $$;
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text not null default '' check (phone ~ '^[0-9]{0,13}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create type public.app_role as enum ('staff', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy user_roles_select_own on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()));
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'staff');
$$;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '[^0-9]', '', 'g'), 13)
  )
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant all on public.profiles to service_role;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create table public.items (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.gen_ref('OBJ', 6),
  name text not null check (char_length(name) between 2 and 80),
  category text not null check (category in ('eletronicos','documentos','chaves','garrafas','roupas','bolsas','material','acessorios','outros')),
  color text not null check (color in ('preto','branco','cinza','azul','vermelho','verde','amarelo','laranja','rosa','roxo','marrom','bege','prata','multicolorido')),
  location text not null check (char_length(location) between 2 and 60),
  date_found date not null,
  description text not null check (char_length(description) between 10 and 600),
  marks text[] not null default '{}' check (cardinality(marks) <= 10),
  status text not null default 'Encontrado' check (status in ('Encontrado','Aguardando retirada','Devolvido')),
  sensitive boolean not null default false,
  hidden boolean not null default false,
  photo_path text,
  reported_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_public_idx on public.items (date_found desc) where status <> 'Devolvido' and not hidden;
create index items_reported_by_idx on public.items (reported_by);
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();
revoke all on public.items from anon, authenticated;
grant select, insert, update, delete on public.items to authenticated;
grant all on public.items to service_role;
alter table public.items enable row level security;
create policy items_select on public.items for select to authenticated
  using (reported_by = (select auth.uid()) or public.is_staff());
create policy items_insert on public.items for insert to authenticated
  with check (
    public.is_staff()
    or (
      reported_by = (select auth.uid())
      and status = 'Encontrado'
      and hidden = false
      and date_found <= current_date
      and (photo_path is null or photo_path like (select auth.uid())::text || '/%')
    )
  );
create policy items_update_staff on public.items for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy items_delete_staff on public.items for delete to authenticated
  using (public.is_staff());
create view public.public_items with (security_invoker = false) as
  select
    i.id, i.ref, i.name, i.category, i.color, i.location, i.date_found,
    i.description, i.marks, i.status,
    case when i.sensitive then null else i.photo_path end as photo_path,
    (i.sensitive and i.photo_path is not null) as photo_hidden,
    i.created_at
  from public.items i
  where i.status <> 'Devolvido' and not i.hidden and i.date_found >= current_date - 90;
revoke all on public.public_items from anon, authenticated;
grant select on public.public_items to anon, authenticated, service_role;

create table public.lost_reports (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.gen_ref('PRD', 6),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  category text not null check (category in ('eletronicos','documentos','chaves','garrafas','roupas','bolsas','material','acessorios','outros')),
  color text not null check (color in ('preto','branco','cinza','azul','vermelho','verde','amarelo','laranja','rosa','roxo','marrom','bege','prata','multicolorido')),
  location text not null check (char_length(location) between 2 and 60),
  date_lost date not null,
  description text not null check (char_length(description) between 10 and 600),
  contact_email text not null default '' check (contact_email = '' or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  contact_phone text not null default '' check (contact_phone ~ '^([0-9]{10,11})?$'),
  photo_path text,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lost_reports_contact_required check (contact_email <> '' or contact_phone <> '')
);
create index lost_reports_user_idx on public.lost_reports (user_id, created_at desc);
create trigger lost_reports_updated_at before update on public.lost_reports
  for each row execute function public.set_updated_at();
revoke all on public.lost_reports from anon, authenticated;
grant select, delete on public.lost_reports to authenticated;
grant insert (name, category, color, location, date_lost, description, contact_email, contact_phone, photo_path)
  on public.lost_reports to authenticated;
grant update (name, category, color, location, date_lost, description, contact_email, contact_phone, is_open)
  on public.lost_reports to authenticated;
grant all on public.lost_reports to service_role;
alter table public.lost_reports enable row level security;
create policy lost_reports_select on public.lost_reports for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy lost_reports_insert_own on public.lost_reports for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (photo_path is null or photo_path like (select auth.uid())::text || '/%')
  );
create policy lost_reports_update on public.lost_reports for update to authenticated
  using (user_id = (select auth.uid()) or public.is_staff())
  with check (user_id = (select auth.uid()) or public.is_staff());
create policy lost_reports_delete_own on public.lost_reports for delete to authenticated
  using (user_id = (select auth.uid()));

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.gen_ref('SOL', 6),
  item_id uuid not null references public.items (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  contact_email text not null default '' check (contact_email = '' or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  contact_phone text not null default '' check (contact_phone ~ '^([0-9]{10,11})?$'),
  proof text not null check (char_length(proof) between 10 and 600),
  status text not null default 'Em análise' check (status in ('Em análise','Aprovada','Recusada')),
  code_hash text,
  code_used boolean not null default false,
  code_issued_at timestamptz,
  decided_at timestamptz,
  picked_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claims_contact_required check (contact_email <> '' or contact_phone <> '')
);
create unique index claims_one_active_per_user on public.claims (item_id, user_id) where status <> 'Recusada';
create unique index claims_code_hash_key on public.claims (code_hash) where code_hash is not null;
create index claims_user_idx on public.claims (user_id, created_at desc);
create trigger claims_updated_at before update on public.claims
  for each row execute function public.set_updated_at();
create or replace function public.is_item_claimable(p_item_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.public_items where id = p_item_id and status = 'Encontrado');
$$;
revoke all on public.claims from anon, authenticated;
grant select (id, ref, item_id, user_id, name, contact_email, contact_phone, proof, status, code_used,
  code_issued_at, decided_at, picked_up_at, created_at, updated_at) on public.claims to authenticated;
grant insert (item_id, name, contact_email, contact_phone, proof) on public.claims to authenticated;
grant delete on public.claims to authenticated;
grant all on public.claims to service_role;
alter table public.claims enable row level security;
create policy claims_select on public.claims for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy claims_insert_own on public.claims for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_item_claimable(item_id));
create policy claims_delete_own_pending on public.claims for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'Em análise');

create or replace function public.get_public_stats()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'available', (select count(*) from public.public_items where status = 'Encontrado'),
    'awaiting', (select count(*) from public.public_items where status = 'Aguardando retirada'),
    'returned', (select count(*) from public.items where status = 'Devolvido'),
    'openReports', (select count(*) from public.lost_reports where is_open)
  );
$$;
create or replace function public.my_claims()
returns table (
  id uuid, ref text, item_id uuid, item_ref text, item_name text, item_category text,
  item_status text, status text, proof text, code_used boolean, code_issued_at timestamptz,
  decided_at timestamptz, picked_up_at timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.ref, c.item_id, i.ref, i.name, i.category, i.status, c.status, c.proof,
         c.code_used, c.code_issued_at, c.decided_at, c.picked_up_at, c.created_at
  from public.claims c join public.items i on i.id = c.item_id
  where c.user_id = (select auth.uid())
  order by c.created_at desc;
$$;
create or replace function public.approve_claim(p_claim_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_claim public.claims%rowtype;
  v_item_status text;
begin
  if not public.is_staff() then
    raise exception 'Acesso restrito à recepção.' using errcode = '42501';
  end if;
  select * into v_claim from public.claims where id = p_claim_id for update;
  if not found or v_claim.status = 'Recusada' then
    raise exception 'Solicitação inválida.';
  end if;
  select status into v_item_status from public.items where id = v_claim.item_id for update;
  if v_item_status = 'Devolvido' then
    raise exception 'Este objeto já foi devolvido.';
  end if;
  update public.claims set status = 'Recusada', code_hash = null, decided_at = now()
   where item_id = v_claim.item_id and id <> v_claim.id and status <> 'Recusada';
  update public.claims set status = 'Aprovada', decided_at = now() where id = v_claim.id;
  update public.items set status = 'Aguardando retirada' where id = v_claim.item_id;
end; $$;
create or replace function public.reject_claim(p_claim_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_item_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Acesso restrito à recepção.' using errcode = '42501';
  end if;
  update public.claims set status = 'Recusada', code_hash = null, decided_at = now()
   where id = p_claim_id and not code_used
  returning item_id into v_item_id;
  if v_item_id is null then
    raise exception 'Solicitação não encontrada ou já concluída.';
  end if;
  update public.items set status = 'Encontrado'
   where id = v_item_id and status = 'Aguardando retirada'
     and not exists (select 1 from public.claims where item_id = v_item_id and status = 'Aprovada');
end; $$;
create or replace function public.issue_pickup_code(p_claim_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_claim public.claims%rowtype;
  v_raw text;
  v_code text;
begin
  select * into v_claim from public.claims where id = p_claim_id for update;
  if not found or (v_claim.user_id <> (select auth.uid()) and not public.is_staff()) then
    raise exception 'Solicitação não encontrada.';
  end if;
  if v_claim.status <> 'Aprovada' or v_claim.code_used then
    raise exception 'Não é possível gerar código para esta solicitação.';
  end if;
  v_raw := public.gen_ref('', 8);
  v_code := substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4);
  update public.claims
     set code_hash = encode(extensions.digest(v_code, 'sha256'), 'hex'), code_issued_at = now()
   where id = p_claim_id;
  return v_code;
end; $$;
create or replace function public.validate_pickup_code(p_code text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_claim public.claims%rowtype;
  v_item public.items%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Acesso restrito à recepção.' using errcode = '42501';
  end if;
  if length(v_clean) <> 8 then
    raise exception 'O código tem 8 caracteres (ex.: K7QM-4XPA).';
  end if;
  select * into v_claim from public.claims
   where code_hash = encode(extensions.digest(substr(v_clean, 1, 4) || '-' || substr(v_clean, 5, 4), 'sha256'), 'hex')
     and status = 'Aprovada'
   for update;
  if not found then raise exception 'Código inválido.'; end if;
  if v_claim.code_used then raise exception 'Este código já foi utilizado.'; end if;
  update public.claims set code_used = true, picked_up_at = now() where id = v_claim.id;
  update public.items set status = 'Devolvido' where id = v_claim.item_id returning * into v_item;
  return json_build_object('itemRef', v_item.ref, 'itemName', v_item.name, 'claimant', v_claim.name);
end; $$;

revoke execute on function public.gen_ref(text, int) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_item_claimable(uuid) from public, anon;
revoke execute on function public.my_claims() from public, anon;
revoke execute on function public.approve_claim(uuid) from public, anon;
revoke execute on function public.reject_claim(uuid) from public, anon;
revoke execute on function public.issue_pickup_code(uuid) from public, anon;
revoke execute on function public.validate_pickup_code(text) from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_item_claimable(uuid) to authenticated;
grant execute on function public.my_claims() to authenticated;
grant execute on function public.approve_claim(uuid) to authenticated;
grant execute on function public.reject_claim(uuid) to authenticated;
grant execute on function public.issue_pickup_code(uuid) to authenticated;
grant execute on function public.validate_pickup_code(text) to authenticated;
grant execute on function public.get_public_stats() to anon, authenticated;

create or replace function public.is_public_photo(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.public_items where photo_path = p_path);
$$;
revoke execute on function public.is_public_photo(text) from public;
grant execute on function public.is_public_photo(text) to anon, authenticated;
create policy item_photos_read on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'item-photos'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_staff() or public.is_public_photo(name))
  );
create policy item_photos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy item_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_staff()));