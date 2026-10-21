-- MEMORIAL M2/UAT — bind existing Supabase Auth test users to demo resources.
-- REQUIRES all 8 accounts ALREADY CREATED/CONFIRMED through Supabase Auth API/Dashboard.
-- Fails atomically if an account is missing, duplicated, or not confirmed.
-- Deliberately does not create auth.users, set passwords, or grant platform OWNER.
begin;
do $$
declare
 emails text[] := array[
 'owner.aurora@memorial-test.example','operatore.aurora@memorial-test.example',
 'owner.quiete@memorial-test.example','owner.ricordo@memorial-test.example',
 'laura.rossi@memorial-test.example','marco.rossi@memorial-test.example',
 'anna.bianchi@memorial-test.example','elena.verdi@memorial-test.example'];
 mail text;
begin
 foreach mail in array emails loop
   if (select count(*) from auth.users where lower(email)=mail and email_confirmed_at is not null)<>1
   then raise exception 'Missing or unconfirmed Auth identity for %',mail; end if;
 end loop;
 if (select count(*) from public.agencies where is_demo)=0 or
 (select count(*) from public.memorials where is_demo)<>12 then
 raise exception 'Demo catalog missing or incomplete'; end if;
end $$;
insert into public.profiles(user_id,display_name,is_demo)
select u.id,
  case lower(u.email)
  when 'owner.aurora@memorial-test.example' then 'Responsabile Aurora'
  when 'operatore.aurora@memorial-test.example' then 'Operatore Aurora'
  when 'owner.quiete@memorial-test.example' then 'Responsabile La Quiete'
  when 'owner.ricordo@memorial-test.example' then 'Responsabile Il Ricordo'
  when 'laura.rossi@memorial-test.example' then 'Laura Rossi'
  when 'marco.rossi@memorial-test.example' then 'Marco Rossi'
  when 'anna.bianchi@memorial-test.example' then 'Anna Bianchi'
  when 'elena.verdi@memorial-test.example' then 'Elena Verdi'
  end,true
from auth.users u
where lower(u.email) in (
 'owner.aurora@memorial-test.example','operatore.aurora@memorial-test.example',
 'owner.quiete@memorial-test.example','owner.ricordo@memorial-test.example',
 'laura.rossi@memorial-test.example','marco.rossi@memorial-test.example',
 'anna.bianchi@memorial-test.example','elena.verdi@memorial-test.example')
on conflict (user_id) do update set display_name=excluded.display_name
where public.profiles.is_demo;
insert into public.agency_members(agency_id,user_id,role,active,is_demo)
select a.id,u.id,
  case when lower(u.email)='operatore.aurora@memorial-test.example' then 'OPERATOR'
  else 'OWNER' end,
  (a.status='ACTIVE'),true
from (values
 ('A01','owner.aurora@memorial-test.example'),
 ('A01','operatore.aurora@memorial-test.example'),
 ('A02','owner.quiete@memorial-test.example'),
 ('A03','owner.ricordo@memorial-test.example')
) v(code,email)
join public.agencies a on a.demo_code=v.code and a.is_demo
join auth.users u on lower(u.email)=v.email
on conflict (agency_id,user_id) do update set role=excluded.role,active=excluded.active
where public.agency_members.is_demo;
insert into public.family_members
(memorial_id,user_id,role,can_moderate,can_edit_content,can_view_contacts,active,is_demo)
select m.id,u.id,v.role,v.can_moderate,v.can_edit,true,true,true
from (values
 ('M01','laura.rossi@memorial-test.example','OWNER',true,true),
 ('M02','laura.rossi@memorial-test.example','OWNER',true,true),
 ('M01','marco.rossi@memorial-test.example','EDITOR',true,true),
 ('M02','marco.rossi@memorial-test.example','EDITOR',true,true),
 ('M07','anna.bianchi@memorial-test.example','OWNER',true,true),
 ('M08','anna.bianchi@memorial-test.example','OWNER',true,true),
 ('M09','anna.bianchi@memorial-test.example','OWNER',true,true),
 ('M10','elena.verdi@memorial-test.example','OWNER',true,true),
 ('M11','elena.verdi@memorial-test.example','OWNER',true,true),
 ('M12','elena.verdi@memorial-test.example','OWNER',true,true)
) v(code,email,role,can_moderate,can_edit)
join public.memorials m on m.demo_code=v.code and m.is_demo
join auth.users u on lower(u.email)=v.email
on conflict(memorial_id,user_id) do update set
 role=excluded.role,can_moderate=excluded.can_moderate,
 can_edit_content=excluded.can_edit_content,active=excluded.active
where public.family_members.is_demo;
commit;
