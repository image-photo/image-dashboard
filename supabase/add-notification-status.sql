alter table public.work_orders
add column if not exists notification_status text not null default 'Not Notified';

alter table public.work_orders
drop constraint if exists work_orders_notification_status_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_orders_notification_status_check'
  ) then
    alter table public.work_orders
    add constraint work_orders_notification_status_check
    check (
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
    );
  end if;
end $$;
