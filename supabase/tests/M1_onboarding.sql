-- Only ephemeral PostgreSQL CI; depends on M1 baseline + onboarding migrations.
\set ON_ERROR_STOP on
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-4000-8000-000000000081','verified81@example.invalid',now()),
 ('00000000-0000-4000-8000-000000000082','verified82@example.invalid',now()),
 ('00000000-0000-4000-8000-000000000083','notverified@example.invalid',null);

-- A request is denied until BOTH approved legal documents exist.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000081"}',true);
do $body$
begin
 begin
   perform public.complete_agency_registration('Synthetic Agency 81','12345678903','1','1');
   raise exception 'UNEXPECTED_SUCCESS';
 exception when raise_exception then
   if sqlerrm='UNEXPECTED_SUCCESS' then raise; end if;
 end;
end $body$;
rollback;

-- Simulates EXPLICIT publication after legal approval. No live document is seeded.
insert into public.agency_legal_documents(kind,version,document_url,published_at,active) values
 ('B2B_TERMS','1','https://example.invalid/terms',now(),true),
 ('PRIVACY_NOTICE','1','https://example.invalid/privacy',now(),true);

begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000081"}',true);
do $body$
declare first_id uuid; second_id uuid;
begin
 first_id:=public.complete_agency_registration('Synthetic Agency 81','12345678903','1','1');
 second_id:=public.complete_agency_registration('Synthetic Agency 81','12345678903','1','1');
 if first_id is null or first_id<>second_id then raise exception 'Idempotency failure'; end if;
 if (select count(*) from public.agencies where id=first_id and plan='FREE')<>1 then
  raise exception 'Free plan not saved';
 end if;
 if (select count(*) from public.agency_members
 where agency_id=first_id and user_id=auth.uid() and role='OWNER')<>1 then
  raise exception 'Agency OWNER membership missing';
 end if;
 if has_table_privilege('authenticated','public.agency_registration_acceptances','SELECT') then
  raise exception 'Acceptance records readable';
 end if;
end $body$;
commit;

-- A second verified user must not take over the same VAT.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000082"}',true);
do $body$
begin
 begin
   perform public.complete_agency_registration('Duplicate VAT','12345678903','1','1');
   raise exception 'UNEXPECTED_SUCCESS';
 exception when unique_violation then null;
 end;
end $body$;
rollback;

-- An unverified user is denied, despite possessing authenticated DB role.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000083"}',true);
do $body$
begin
 begin
   perform public.complete_agency_registration('Unverified Agency','12345678903','1','1');
   raise exception 'UNEXPECTED_SUCCESS';
 exception when raise_exception then
   if sqlerrm='UNEXPECTED_SUCCESS' then raise; end if;
 end;
end $body$;
rollback;

-- Anonymous role cannot execute the privileged function.
do $body$
begin
 if has_function_privilege('anon',
 'public.complete_agency_registration(text,text,text,text)','EXECUTE') then
  raise exception 'Anon can call onboarding RPC';
 end if;
end $body$;
\echo 'M1 agency onboarding verified in disposable PostgreSQL'
