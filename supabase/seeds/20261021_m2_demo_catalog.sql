-- M2: deterministic persisted fixtures from 11_DUMMY_GUIDA.md.
-- All values synthetic. No Auth users, payment, email or external side-effects.
-- Guarded UPSERT: never overwrite a real record even if its UUID collided.
begin;
do $$
begin
 if exists(select 1 from public.agencies where id in ('aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000003') and is_demo is not true)
    or exists(select 1 from public.memorials where id in ('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002','bbbbbbbb-0000-4000-8000-000000000003','bbbbbbbb-0000-4000-8000-000000000004','bbbbbbbb-0000-4000-8000-000000000005','bbbbbbbb-0000-4000-8000-000000000006','bbbbbbbb-0000-4000-8000-000000000007','bbbbbbbb-0000-4000-8000-000000000008','bbbbbbbb-0000-4000-8000-000000000009','bbbbbbbb-0000-4000-8000-000000000010','bbbbbbbb-0000-4000-8000-000000000011','bbbbbbbb-0000-4000-8000-000000000012') and is_demo is not true) then
   raise exception 'Demo seed blocked: reserved UUID collides with real data';
 end if;
end $$;
insert into public.agencies(id,demo_code,legal_name,city,plan,status,is_demo)
values
  ('aaaaaaaa-0000-4000-8000-000000000001','A01','Aurora Onoranze','Torino','PRO','ACTIVE',true),
  ('aaaaaaaa-0000-4000-8000-000000000002','A02','Onoranze La Quiete','Cuneo','FREE','ACTIVE',true),
  ('aaaaaaaa-0000-4000-8000-000000000003','A03','Il Ricordo','Asti','FREE','CLOSED',true)
on conflict(id) do update set demo_code=excluded.demo_code,
  legal_name=excluded.legal_name,city=excluded.city,plan=excluded.plan,
  status=excluded.status
where public.agencies.is_demo is true;
insert into public.memorials(id,demo_code,agency_id,deceased_name,tier,status,
  visibility,birth_date,death_date,first_published_at,covered_until,is_demo)
values
  ('bbbbbbbb-0000-4000-8000-000000000001','M01','aaaaaaaa-0000-4000-8000-000000000001','Giovanni Rossi','PREMIUM','PUBLISHED_ACTIVE','PUBLIC','1948-04-12','2025-10-04',now()-interval '30 days',now()+interval '320 days',true),
  ('bbbbbbbb-0000-4000-8000-000000000002','M02','aaaaaaaa-0000-4000-8000-000000000001','Teresa Rossi','STANDARD','PRESERVED_STATIC','UNLISTED','1948-04-12','2025-10-04',now()-interval '520 days',now()+interval '320 days',true),
  ('bbbbbbbb-0000-4000-8000-000000000003','M03','aaaaaaaa-0000-4000-8000-000000000001','Carlo Ferrero','STANDARD','DRAFT','UNLISTED','1948-04-12','2025-10-04',null,null,true),
  ('bbbbbbbb-0000-4000-8000-000000000004','M04','aaaaaaaa-0000-4000-8000-000000000001','Lucia Fontana','PREMIUM','PAYMENT_PENDING','UNLISTED','1948-04-12','2025-10-04',null,null,true),
  ('bbbbbbbb-0000-4000-8000-000000000005','M05','aaaaaaaa-0000-4000-8000-000000000001','Pietro Longo','STANDARD','SKELETON_ACTIVE','UNLISTED','1948-04-12','2025-10-04',null,null,true),
  ('bbbbbbbb-0000-4000-8000-000000000006','M06','aaaaaaaa-0000-4000-8000-000000000001','Giulia Marino','PREMIUM','FAMILY_PREPARING','UNLISTED','1948-04-12','2025-10-04',null,null,true),
  ('bbbbbbbb-0000-4000-8000-000000000007','M07','aaaaaaaa-0000-4000-8000-000000000002','Ada Bianchi','STANDARD','READY_FOR_PUBLICATION','UNLISTED','1948-04-12','2025-10-04',null,null,true),
  ('bbbbbbbb-0000-4000-8000-000000000008','M08','aaaaaaaa-0000-4000-8000-000000000002','Enzo Bianchi','STANDARD','EXPIRED','UNLISTED','1948-04-12','2025-10-04',now()-interval '520 days',now()-interval '15 days',true),
  ('bbbbbbbb-0000-4000-8000-000000000009','M09','aaaaaaaa-0000-4000-8000-000000000002','Rosa Neri','PREMIUM','UNPUBLISHED_ARCHIVED','UNLISTED','1948-04-12','2025-10-04',null,null,true),
  ('bbbbbbbb-0000-4000-8000-000000000010','M10','aaaaaaaa-0000-4000-8000-000000000003','Bruno Verdi','STANDARD','ARCHIVED','UNLISTED','1948-04-12','2025-10-04',now()-interval '520 days',now()+interval '320 days',true),
  ('bbbbbbbb-0000-4000-8000-000000000011','M11','aaaaaaaa-0000-4000-8000-000000000003','Emma Verdi','PREMIUM','CLOSED','UNLISTED','1948-04-12','2025-10-04',now()-interval '520 days',now()+interval '320 days',true),
  ('bbbbbbbb-0000-4000-8000-000000000012','M12','aaaaaaaa-0000-4000-8000-000000000003','Maria Verdi','PREMIUM','SUSPENDED','UNLISTED','1948-04-12','2025-10-04',now()-interval '520 days',now()+interval '320 days',true)
on conflict(id) do update set demo_code=excluded.demo_code,
  agency_id=excluded.agency_id,deceased_name=excluded.deceased_name,
  tier=excluded.tier,status=excluded.status,visibility=excluded.visibility,
  birth_date=excluded.birth_date,death_date=excluded.death_date,
  first_published_at=excluded.first_published_at,
  covered_until=excluded.covered_until
where public.memorials.is_demo is true;
do $$
begin
 if (select count(*) from public.agencies where is_demo and demo_code between 'A01' and 'A03')<>3
   or (select count(*) from public.memorials where is_demo and demo_code between 'M01' and 'M12')<>12 then
   raise exception 'Demo fixture invariant failed';
 end if;
end $$;
commit;
