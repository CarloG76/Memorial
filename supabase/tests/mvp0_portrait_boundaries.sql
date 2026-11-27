-- Ephemeral CI ONLY. Assert allowed and forbidden actions after applying the
-- full 20261127154500_mvp0_agency_portrait_delegation.sql migration.
-- Agency operator BEFORE delegation:
set role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',false);
do $$
begin
 if public.can_upload_memorial_portrait('dddddddd-dddd-4ddd-8ddd-dddddddddddd')
 then raise exception 'Cross-agency upload authorized';end if;
 if not public.can_upload_memorial_portrait('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
 then raise exception 'Valid delegated upload rejected';end if;
end $$;
-- Even WITH a delegation, a direct unlogged portrait write must be denied.
do $$
declare denied boolean:=false;
begin
 begin
  perform public.set_memorial_portrait(
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc/ffffffff-ffff-4fff-8fff-ffffffffffff.jpg'
  );
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Agency bypassed context-aware portrait RPC';end if;
end $$;
-- The context-aware, audit-backed route is allowed.
select public.agency_family_set_memorial_portrait(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc/ffffffff-ffff-4fff-8fff-ffffffffffff.jpg',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
);
reset role;
do $$
begin
 if (select count(*) from public.agency_family_operator_events
  where actor_id='11111111-1111-4111-8111-111111111111'
   and action='FAMILY_PORTRAIT_UPDATED')<>1
 then raise exception 'Delegated edit missing audit';end if;
end $$;
-- Close the context, then both upload authorization and delegated updates deny.
update public.agency_family_operator_contexts set closed_at=now()
 where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
set role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',false);
do $$
declare denied boolean:=false;
begin
 if public.can_upload_memorial_portrait('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
 then raise exception 'Closed context can still upload portrait';end if;
 begin
  perform public.agency_family_set_memorial_portrait(
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc/ffffffff-ffff-4fff-8fff-ffffffffffff.jpg',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  );
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Closed context can still update portrait';end if;
end $$;
-- Family owner remains able to upload and save directly.
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222"}',false);
do $$
begin
 if not public.can_upload_memorial_portrait('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
 then raise exception 'Family owner lost upload access';end if;
 if public.can_upload_memorial_portrait('dddddddd-dddd-4ddd-8ddd-dddddddddddd')
 then raise exception 'Family owner gained cross-tenant access';end if;
end $$;
select public.set_memorial_portrait(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc/ffffffff-ffff-4fff-8fff-ffffffffffff.jpg'
);
-- Platform OWNER remains able to save directly.
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333"}',false);
do $$
begin
 if not public.can_upload_memorial_portrait('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
 then raise exception 'Platform OWNER lost upload access';end if;
end $$;
select public.set_memorial_portrait(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc/ffffffff-ffff-4fff-8fff-ffffffffffff.jpg'
);
reset role;
-- No anonymous RPC or helper execution, and RLS still enabled on storage.
do $$
begin
 if has_function_privilege('anon','public.set_memorial_portrait(uuid,text)','EXECUTE') or
 has_function_privilege('anon','public.can_upload_memorial_portrait(uuid)','EXECUTE') or
 has_function_privilege('anon','public.agency_family_set_memorial_portrait(uuid,text,uuid)','EXECUTE')
 then raise exception 'Anonymous portrait authorization entrypoint exposed';end if;
 if not (select relrowsecurity from pg_class where oid='storage.objects'::regclass)
 then raise exception 'Storage RLS disabled';end if;
end $$;
