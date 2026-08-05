do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'contacts'
      and policyname = 'Authenticated users can delete contacts'
  ) then
    create policy "Authenticated users can delete contacts"
    on public.contacts
    for delete
    to authenticated
    using (true);
  end if;
end $$;
