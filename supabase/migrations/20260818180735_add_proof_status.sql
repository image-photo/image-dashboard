alter table public.work_orders
add column proof_status text not null default 'Not Required';

alter table public.work_orders
add constraint work_orders_proof_status_check
check (
  proof_status in (
    'Not Required',
    'Preparing Proof',
    'Awaiting Client Approval',
    'Revisions Requested',
    'Approved'
  )
);

drop function public.create_customer_and_work_order(
  text, text, text, date, text, text, text, text, text, text, uuid, text[], text, text, text, text
);

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
  p_pickup_delivery_status text default 'Not Ready',
  p_proof_status text default 'Not Required'
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
    pickup_delivery_status,
    proof_status
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
    p_pickup_delivery_status,
    p_proof_status
  )
  returning id into new_work_order_id;

  return query select new_customer_id, new_work_order_id;
end;
$$;

revoke all on function public.create_customer_and_work_order(
  text, text, text, date, text, text, text, text, text, text, uuid, text[], text, text, text, text, text
) from public, anon;
grant execute on function public.create_customer_and_work_order(
  text, text, text, date, text, text, text, text, text, text, uuid, text[], text, text, text, text, text
) to authenticated, service_role;
