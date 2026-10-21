-- Strictly synthetic fixture content; deterministic IDs, read-only until moderation RPC.
-- No real email, external notification, payment or localStorage.
begin;
do $$
begin
 if not exists(select 1 from public.memorials where demo_code='M01' and is_demo)
 or not exists(select 1 from public.memorials where demo_code='M02' and is_demo)
 then raise exception 'Demo M01/M02 prerequisites missing'; end if;
 if exists (select 1 from public.memorial_memories where id in
   ('cccccccc-0000-4000-8000-000000000001'::uuid,'cccccccc-0000-4000-8000-000000000002'::uuid)
   and not is_demo)
 or exists (select 1 from public.memorial_thoughts where id in
   ('cccccccc-0000-4000-8000-000000000003'::uuid,'cccccccc-0000-4000-8000-000000000004'::uuid)
   and not is_demo)
 then raise exception 'Collision with non-demo content'; end if;
end $$;
insert into public.memorial_memories(id,memorial_id,is_demo,title,body,moderation_status)
values
('cccccccc-0000-4000-8000-000000000001',(select id from public.memorials where demo_code='M01' and is_demo),true,'Un ricordo in famiglia','Giovanni ci ha sempre insegnato il valore dei piccoli gesti e della famiglia.','APPROVED'),
('cccccccc-0000-4000-8000-000000000002',(select id from public.memorials where demo_code='M02' and is_demo),true,'La voce di Teresa','Un ricordo semplice, custodito con affetto da chi le ha voluto bene.','APPROVED')
on conflict(id) do update set memorial_id=excluded.memorial_id,title=excluded.title,body=excluded.body,moderation_status=excluded.moderation_status
where public.memorial_memories.is_demo;
insert into public.memorial_thoughts(id,memorial_id,is_demo,author_name,body,moderation_status)
values
('cccccccc-0000-4000-8000-000000000003',(select id from public.memorials where demo_code='M01' and is_demo),true,'Paolo','Un pensiero di affetto a tutta la famiglia Rossi.','APPROVED'),
('cccccccc-0000-4000-8000-000000000004',(select id from public.memorials where demo_code='M01' and is_demo),true,'Giulia','Vi sono vicina in questo momento difficile.','PENDING')
on conflict(id) do update set memorial_id=excluded.memorial_id,author_name=excluded.author_name,body=excluded.body,moderation_status=excluded.moderation_status
where public.memorial_thoughts.is_demo;
commit;