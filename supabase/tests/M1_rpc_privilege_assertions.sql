-- Verify the public RPC does not own elevated rights. Disposable PG17 CI only.
do $$ begin
 if not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='complete_agency_registration'
  and p.prosecdef=false
 ) then raise exception 'Public registration RPC is privileged'; end if;
 if not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='app_private' and p.proname='complete_agency_registration'
  and p.prosecdef=true
 ) then raise exception 'Private registration implementation missing'; end if;
 if has_function_privilege('anon','public.complete_agency_registration(text,text,text,text)','EXECUTE')
 then raise exception 'Anon may register agencies'; end if;
 if not has_function_privilege('authenticated','public.complete_agency_registration(text,text,text,text)','EXECUTE')
 then raise exception 'Verified clients cannot request onboarding'; end if;
end $$;
