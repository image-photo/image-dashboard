alter table public.contacts
add column if not exists last_contacted_date date;

alter table public.contacts
add column if not exists next_follow_up_date date;
