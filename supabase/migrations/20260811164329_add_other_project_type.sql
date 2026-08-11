alter table public.work_orders
  drop constraint if exists work_orders_project_type_check;

alter table public.work_orders
  add constraint work_orders_project_type_check check (
    project_type in ('Transfer', 'Scan / Reproduction', 'Studio Session', 'Other')
  );
