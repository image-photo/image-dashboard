-- Image Studio production baseline
-- Single-studio data model with active-staff RLS, admin-only destructive
-- actions, audit history, optimistic-concurrency metadata, and indexed FKs.

create schema if not exists private;
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

-- New API objects are private by default. Each application-facing grant is
-- declared explicitly later in this migration.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'staff',
  dashboard_view text not null default 'studio',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint profiles_full_name_not_blank check (btrim(full_name) <> ''),
  constraint profiles_role_check check (role in ('admin', 'staff')),
  constraint profiles_dashboard_view_check check (dashboard_view in ('studio', 'personal')),
  constraint profiles_version_positive check (version > 0)
);

create table public.customers (
  id bigint generated always as identity primary key,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email extensions.citext,
  street_address text,
  city text,
  state text,
  zip_code text,
  archived_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  updated_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint customers_first_name_not_blank check (btrim(first_name) <> ''),
  constraint customers_last_name_not_blank check (btrim(last_name) <> ''),
  constraint customers_phone_not_blank check (btrim(phone) <> ''),
  constraint customers_email_check check (
    email is null or email::text ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint customers_state_check check (state is null or state ~ '^[A-Z]{2}$'),
  constraint customers_zip_code_check check (zip_code is null or zip_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  constraint customers_version_positive check (version > 0)
);

create table public.contacts (
  id bigint generated always as identity primary key,
  organization_name text not null,
  contact_name text not null,
  contact_role text,
  phone text,
  email extensions.citext,
  street_address text,
  city text,
  state text,
  zip_code text,
  type text,
  status text not null default 'Active',
  last_contacted_date date,
  next_follow_up_date date,
  notes text,
  archived_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  updated_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint contacts_organization_name_not_blank check (btrim(organization_name) <> ''),
  constraint contacts_contact_name_not_blank check (btrim(contact_name) <> ''),
  constraint contacts_email_check check (
    email is null or email::text ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint contacts_state_check check (state is null or state ~ '^[A-Z]{2}$'),
  constraint contacts_zip_code_check check (zip_code is null or zip_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  constraint contacts_type_check check (
    type is null or type in ('School', 'Church', 'Sports', 'Business', 'Event', 'Other')
  ),
  constraint contacts_status_check check (status in ('Active', 'Prospect', 'Inactive')),
  constraint contacts_version_positive check (version > 0)
);

create table public.work_orders (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public.customers(id) on delete restrict,
  due_date date not null,
  project_type text not null,
  description text not null default '',
  project_options text[] not null default '{}'::text[],
  assigned_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'Open',
  payment_status text not null default 'Not Checked',
  notification_status text not null default 'Not Notified',
  pickup_delivery_status text not null default 'Not Ready',
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  updated_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint work_orders_project_type_check check (
    project_type in ('Transfer', 'Scan / Reproduction', 'Studio Session')
  ),
  constraint work_orders_status_check check (
    status in ('Open', 'In Progress', 'Done', 'Canceled', 'Archived')
  ),
  constraint work_orders_payment_status_check check (
    payment_status in (
      'Not Checked',
      'Needs Payment',
      'Partial / Deposit Paid',
      'Paid',
      'Refunded',
      'Bill Later',
      'No Charge'
    )
  ),
  constraint work_orders_notification_status_check check (
    notification_status in (
      'Not Notified',
      'Needs Contact',
      'Called',
      'Left Voicemail',
      'Texted',
      'Emailed',
      'Notified',
      'Follow Up Needed'
    )
  ),
  constraint work_orders_pickup_delivery_status_check check (
    pickup_delivery_status in (
      'Not Ready',
      'Ready for Pickup',
      'Picked Up',
      'Mailed',
      'Delivered',
      'Holding',
      'Not Applicable'
    )
  ),
  constraint work_orders_version_positive check (version > 0)
);

-- Append-only structured notes are available for the notes UI while the
-- legacy contacts.notes column remains for compatibility with the current app.
create table public.contact_notes (
  id bigint generated always as identity primary key,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  note text not null,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint contact_notes_note_not_blank check (btrim(note) <> '')
);

-- Audit data lives outside the exposed API schema and is never writable by
-- browser clients.
create table private.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb,
  constraint audit_log_action_check check (action in ('INSERT', 'UPDATE', 'DELETE'))
);

-- RLS helpers use the caller identity and live in a non-exposed schema to
-- avoid recursive profile policies.
create function private.current_user_is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and active = true
    );
$$;

create function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and active = true
        and role = 'admin'
    );
$$;

create function private.set_profile_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, new.created_at);
    new.version := coalesce(new.version, 1);
  else
    new.id := old.id;
    new.created_at := old.created_at;
    new.updated_at := now();
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

create function private.set_row_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, new.created_at);
    new.created_by := coalesce(new.created_by, (select auth.uid()));
    new.updated_by := coalesce(new.updated_by, new.created_by, (select auth.uid()));
    new.version := coalesce(new.version, 1);
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := coalesce((select auth.uid()), old.updated_by, old.created_by);
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

create function private.log_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_id text;
begin
  if tg_op = 'DELETE' then
    affected_id := old.id::text;
    insert into private.audit_log (
      table_name, record_id, action, changed_by, old_data, new_data
    ) values (
      tg_table_schema || '.' || tg_table_name,
      affected_id,
      tg_op,
      (select auth.uid()),
      to_jsonb(old),
      null
    );
    return old;
  end if;

  affected_id := new.id::text;
  insert into private.audit_log (
    table_name, record_id, action, changed_by, old_data, new_data
  ) values (
    tg_table_schema || '.' || tg_table_name,
    affected_id,
    tg_op,
    (select auth.uid()),
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );
  return new;
end;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, active)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Studio User'
    ),
    'staff',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- A future app update can use this RPC to create a new customer and their
-- first work order as one transaction, eliminating orphan customer records.
create function public.create_customer_and_work_order(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_due_date date,
  p_project_type text,
  p_email text default null,
  p_street_address text default null,
  p_city text default null,
  p_state text default null,
  p_zip_code text default null,
  p_assigned_user_id uuid default null,
  p_project_options text[] default '{}'::text[],
  p_description text default '',
  p_payment_status text default 'Not Checked',
  p_notification_status text default 'Not Notified',
  p_pickup_delivery_status text default 'Not Ready'
)
returns table (customer_id bigint, work_order_id bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_customer_id bigint;
  new_work_order_id bigint;
begin
  insert into public.customers (
    first_name,
    last_name,
    phone,
    email,
    street_address,
    city,
    state,
    zip_code
  ) values (
    p_first_name,
    p_last_name,
    p_phone,
    p_email,
    p_street_address,
    p_city,
    p_state,
    p_zip_code
  )
  returning id into new_customer_id;

  insert into public.work_orders (
    customer_id,
    due_date,
    project_type,
    assigned_user_id,
    project_options,
    description,
    status,
    payment_status,
    notification_status,
    pickup_delivery_status
  ) values (
    new_customer_id,
    p_due_date,
    p_project_type,
    p_assigned_user_id,
    coalesce(p_project_options, '{}'::text[]),
    coalesce(p_description, ''),
    'Open',
    p_payment_status,
    p_notification_status,
    p_pickup_delivery_status
  )
  returning id into new_work_order_id;

  return query select new_customer_id, new_work_order_id;
end;
$$;

-- Auth profile creation.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Consistent timestamps, attribution, and optimistic-concurrency versions.
create trigger profiles_set_audit_fields
  before insert or update on public.profiles
  for each row execute function private.set_profile_audit_fields();
create trigger customers_set_audit_fields
  before insert or update on public.customers
  for each row execute function private.set_row_audit_fields();
create trigger contacts_set_audit_fields
  before insert or update on public.contacts
  for each row execute function private.set_row_audit_fields();
create trigger work_orders_set_audit_fields
  before insert or update on public.work_orders
  for each row execute function private.set_row_audit_fields();

-- Immutable audit trail for business records and staff profiles.
create trigger profiles_audit_log
  after insert or update or delete on public.profiles
  for each row execute function private.log_row_change();
create trigger customers_audit_log
  after insert or update or delete on public.customers
  for each row execute function private.log_row_change();
create trigger contacts_audit_log
  after insert or update or delete on public.contacts
  for each row execute function private.log_row_change();
create trigger work_orders_audit_log
  after insert or update or delete on public.work_orders
  for each row execute function private.log_row_change();
create trigger contact_notes_audit_log
  after insert or delete on public.contact_notes
  for each row execute function private.log_row_change();

-- Foreign-key, directory, status, dashboard, and follow-up indexes.
create index profiles_active_full_name_idx
  on public.profiles (active, lower(full_name), id);

create index customers_created_by_idx on public.customers (created_by);
create index customers_updated_by_idx on public.customers (updated_by);
create index customers_active_name_idx
  on public.customers (lower(last_name), lower(first_name), id)
  where archived_at is null;
create index customers_first_name_trgm_idx
  on public.customers using gin (first_name extensions.gin_trgm_ops)
  where archived_at is null;
create index customers_last_name_trgm_idx
  on public.customers using gin (last_name extensions.gin_trgm_ops)
  where archived_at is null;
create index customers_phone_trgm_idx
  on public.customers using gin (phone extensions.gin_trgm_ops)
  where archived_at is null;

create index contacts_created_by_idx on public.contacts (created_by);
create index contacts_updated_by_idx on public.contacts (updated_by);
create index contacts_active_organization_idx
  on public.contacts (lower(organization_name), id)
  where archived_at is null;
create index contacts_organization_trgm_idx
  on public.contacts using gin (organization_name extensions.gin_trgm_ops)
  where archived_at is null;
create index contacts_name_trgm_idx
  on public.contacts using gin (contact_name extensions.gin_trgm_ops)
  where archived_at is null;
create index contacts_follow_up_idx
  on public.contacts (next_follow_up_date, id)
  where archived_at is null and next_follow_up_date is not null;

create index work_orders_customer_id_idx on public.work_orders (customer_id);
create index work_orders_assigned_user_id_idx on public.work_orders (assigned_user_id);
create index work_orders_created_by_idx on public.work_orders (created_by);
create index work_orders_updated_by_idx on public.work_orders (updated_by);
create index work_orders_status_due_date_idx
  on public.work_orders (status, due_date, id);
create index work_orders_assignee_status_due_date_idx
  on public.work_orders (assigned_user_id, status, due_date, id);

create index contact_notes_contact_created_idx
  on public.contact_notes (contact_id, created_at desc, id desc);
create index contact_notes_author_id_idx on public.contact_notes (author_id);

create index audit_log_record_idx
  on private.audit_log (table_name, record_id, changed_at desc);
create index audit_log_changed_by_idx
  on private.audit_log (changed_by, changed_at desc);

-- RLS is mandatory on every Data API table.
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.contacts enable row level security;
alter table public.work_orders enable row level security;
alter table public.contact_notes enable row level security;

create policy profiles_select_active_staff
  on public.profiles
  for select
  to authenticated
  using ((select private.current_user_is_active_staff()) and active = true);

create policy profiles_update_own_account
  on public.profiles
  for update
  to authenticated
  using (
    (select private.current_user_is_active_staff())
    and id = (select auth.uid())
  )
  with check (
    (select private.current_user_is_active_staff())
    and id = (select auth.uid())
    and active = true
  );

create policy customers_select_active_staff
  on public.customers
  for select
  to authenticated
  using ((select private.current_user_is_active_staff()));
create policy customers_insert_active_staff
  on public.customers
  for insert
  to authenticated
  with check ((select private.current_user_is_active_staff()));
create policy customers_update_active_staff
  on public.customers
  for update
  to authenticated
  using ((select private.current_user_is_active_staff()))
  with check ((select private.current_user_is_active_staff()));
create policy customers_delete_admin_without_jobs
  on public.customers
  for delete
  to authenticated
  using (
    (select private.current_user_is_admin())
    and not exists (
      select 1
      from public.work_orders
      where work_orders.customer_id = customers.id
    )
  );

create policy contacts_select_active_staff
  on public.contacts
  for select
  to authenticated
  using ((select private.current_user_is_active_staff()));
create policy contacts_insert_active_staff
  on public.contacts
  for insert
  to authenticated
  with check ((select private.current_user_is_active_staff()));
create policy contacts_update_active_staff
  on public.contacts
  for update
  to authenticated
  using ((select private.current_user_is_active_staff()))
  with check ((select private.current_user_is_active_staff()));
create policy contacts_delete_admin
  on public.contacts
  for delete
  to authenticated
  using ((select private.current_user_is_admin()));

create policy work_orders_select_active_staff
  on public.work_orders
  for select
  to authenticated
  using ((select private.current_user_is_active_staff()));
create policy work_orders_insert_active_staff
  on public.work_orders
  for insert
  to authenticated
  with check ((select private.current_user_is_active_staff()));
create policy work_orders_update_active_staff
  on public.work_orders
  for update
  to authenticated
  using ((select private.current_user_is_active_staff()))
  with check ((select private.current_user_is_active_staff()));

create policy contact_notes_select_active_staff
  on public.contact_notes
  for select
  to authenticated
  using ((select private.current_user_is_active_staff()));
create policy contact_notes_insert_active_staff
  on public.contact_notes
  for insert
  to authenticated
  with check ((select private.current_user_is_active_staff()));
create policy contact_notes_delete_admin
  on public.contact_notes
  for delete
  to authenticated
  using ((select private.current_user_is_admin()));

-- Explicit Data API privileges. Anonymous clients receive no business-data
-- permissions; RLS remains the second authorization layer for staff clients.
revoke all on public.profiles, public.customers, public.contacts, public.work_orders, public.contact_notes
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, dashboard_view) on public.profiles to authenticated;

grant select on public.customers to authenticated;
grant insert (
  first_name, last_name, phone, email, street_address, city, state, zip_code
) on public.customers to authenticated;
grant update (
  first_name, last_name, phone, email, street_address, city, state, zip_code, archived_at
) on public.customers to authenticated;
grant delete on public.customers to authenticated;

grant select on public.contacts to authenticated;
grant insert (
  organization_name,
  contact_name,
  contact_role,
  phone,
  email,
  street_address,
  city,
  state,
  zip_code,
  type,
  status,
  last_contacted_date,
  next_follow_up_date,
  notes
) on public.contacts to authenticated;
grant update (
  organization_name,
  contact_name,
  contact_role,
  phone,
  email,
  street_address,
  city,
  state,
  zip_code,
  type,
  status,
  last_contacted_date,
  next_follow_up_date,
  notes,
  archived_at
) on public.contacts to authenticated;
grant delete on public.contacts to authenticated;

grant select on public.work_orders to authenticated;
grant insert (
  customer_id,
  due_date,
  project_type,
  description,
  project_options,
  assigned_user_id,
  status,
  payment_status,
  notification_status,
  pickup_delivery_status
) on public.work_orders to authenticated;
grant update (
  customer_id,
  due_date,
  project_type,
  description,
  project_options,
  assigned_user_id,
  status,
  payment_status,
  notification_status,
  pickup_delivery_status
) on public.work_orders to authenticated;

grant select on public.contact_notes to authenticated;
grant insert (contact_id, note) on public.contact_notes to authenticated;
grant delete on public.contact_notes to authenticated;

grant usage, select on sequence public.customers_id_seq to authenticated;
grant usage, select on sequence public.contacts_id_seq to authenticated;
grant usage, select on sequence public.work_orders_id_seq to authenticated;
grant usage, select on sequence public.contact_notes_id_seq to authenticated;

grant all on public.profiles, public.customers, public.contacts, public.work_orders, public.contact_notes
  to service_role;
grant all on sequence public.customers_id_seq, public.contacts_id_seq,
  public.work_orders_id_seq, public.contact_notes_id_seq to service_role;

revoke all on function private.current_user_is_active_staff() from public, anon;
revoke all on function private.current_user_is_admin() from public, anon;
grant execute on function private.current_user_is_active_staff() to authenticated, service_role;
grant execute on function private.current_user_is_admin() to authenticated, service_role;

revoke all on function private.set_profile_audit_fields() from public, anon, authenticated, service_role;
revoke all on function private.set_row_audit_fields() from public, anon, authenticated, service_role;
revoke all on function private.log_row_change() from public, anon, authenticated, service_role;
revoke all on function private.handle_new_user() from public, anon, authenticated, service_role;

revoke all on function public.create_customer_and_work_order(
  text, text, text, date, text, text, text, text, text, text, uuid, text[], text, text, text, text
) from public, anon;
grant execute on function public.create_customer_and_work_order(
  text, text, text, date, text, text, text, text, text, text, uuid, text[], text, text, text, text
) to authenticated, service_role;

comment on table public.profiles is 'Studio staff profiles linked one-to-one with Supabase Auth users.';
comment on table public.customers is 'Retail studio customers; archive instead of deleting historical customers.';
comment on table public.contacts is 'Organizations and their primary business contacts.';
comment on table public.work_orders is 'Studio jobs and lifecycle statuses.';
comment on table public.contact_notes is 'Append-only organization/contact notes with author and timestamp.';
comment on table private.audit_log is 'Private immutable history of business-record changes.';
