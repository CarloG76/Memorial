-- Applied 20 October 2026 to Memorial Supabase project through the connector.
-- Restricts execution of pre-existing SECURITY DEFINER event trigger function.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
