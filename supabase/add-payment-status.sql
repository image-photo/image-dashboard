alter table public.work_orders
add column if not exists payment_status text not null default 'Not Checked';

alter table public.work_orders
drop constraint if exists work_orders_payment_status_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_orders_payment_status_check'
  ) then
    alter table public.work_orders
    add constraint work_orders_payment_status_check
    check (
      payment_status in (
        'Not Checked',
        'Needs Payment',
        'Partial / Deposit Paid',
        'Paid',
        'Refunded',
        'Bill Later',
        'No Charge'
      )
    );
  end if;
end $$;
