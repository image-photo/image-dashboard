alter table public.work_orders
add column if not exists pickup_delivery_status text not null default 'Not Ready';

alter table public.work_orders
drop constraint if exists work_orders_pickup_delivery_status_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_orders_pickup_delivery_status_check'
  ) then
    alter table public.work_orders
    add constraint work_orders_pickup_delivery_status_check
    check (
      pickup_delivery_status in (
        'Not Ready',
        'Ready for Pickup',
        'Picked Up',
        'Mailed',
        'Delivered',
        'Holding',
        'Not Applicable'
      )
    );
  end if;
end $$;
