-- The dashboard's automatic-RLS event trigger needs this function internally,
-- but browser roles must not be able to invoke the SECURITY DEFINER function.
revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated, service_role;
