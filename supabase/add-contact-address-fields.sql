alter table public.contacts
add column if not exists street_address text,
add column if not exists city text,
add column if not exists state text,
add column if not exists zip_code text;
