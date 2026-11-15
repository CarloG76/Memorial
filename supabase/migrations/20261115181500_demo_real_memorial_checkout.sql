-- Commercial sandbox: only seeded DEMO agencies can confirm fake payments.
-- Every simulated order creates a real private DEMO memorial + family invitation.
-- The family is an independent reusable entity per agency/contact email.

create table if not exists public.family_entities(
 id uuid primary key default gen_random_uuid(),
 agency_id uuid not null references public.agencies(id),
 contact_email text not null,
 display_name text,
 is_demo boolean not null default false,
 created_at timestamptz not null default now(),
 unique(agency_id,contact_email),
 unique(id,agency_id)
);
create table if not exists public.memorial_family_entities(
 memorial_id uuid primary key references public.memorials(id),
 family_id uuid not null references public.family_entities(id),
 created_at timestamptz not null default now()
);
alter table public.family_entities enable row level security;
alter table public.memorial_family_entities enable row level security;
revoke all on public.family_entities,public.memorial_family_entities from public,anon,authenticated;

create or replace function public.link_memorial_family_from_invitation()
returns trigger language plpgsql security definer set search_path=''
as $$
declare related_agency uuid; demo boolean; family_key uuid;
begin
 select agency_id,is_demo into related_agency,demo from public.memorials where id=new.memorial_id;
 if related_agency is null then raise exception 'MEMORIAL_NOT_FOUND';end if;
 insert into public.family_entities(agency_id,contact_email,is_demo)
 values(related_agency,lower(btrim(new.invited_email)),demo)
 on conflict(agency_id,contact_email) do update set contact_email=excluded.contact_email
 returning id into family_key;
 insert into public.memorial_family_entities(memorial_id,family_id)
 values(new.memorial_id,family_key)
 on conflict(memorial_id) do nothing;
 return new;
end $$;
drop trigger if exists memorial_family_on_invitation on public.family_invites;
create trigger memorial_family_on_invitation
after insert on public.family_invites for each row execute function public.link_memorial_family_from_invitation();

create table if not exists public.demo_agency_commercial_state(
 agency_id uuid primary key references public.agencies(id),
 plan_code text not null default 'PAYG' check(plan_code in ('PAYG','MONTHLY','YEARLY')),
 free_used int not null default 0 check(free_used between 0 and 2),
 changed_at timestamptz not null default now()
);
create table if not exists public.demo_agency_commercial_events(
 id uuid primary key default gen_random_uuid(),
 agency_id uuid not null references public.agencies(id),
 actor_id uuid not null references auth.users(id),
 action text not null check(action in ('PLAN_SELECTED','MEMORIAL_CONFIRMED')),
 plan_code text not null check(plan_code in ('PAYG','MONTHLY','YEARLY')),
 tier text check(tier in ('STANDARD','PREMIUM')),
 memorial_id uuid references public.memorials(id),
 amount_cents integer not null check(amount_cents>=0),
 simulated boolean not null default true check(simulated),
 free_activation boolean not null default false,
 request_key uuid not null,
 created_at timestamptz not null default now(),
 unique(agency_id,request_key)
);
alter table public.demo_agency_commercial_state enable row level security;
alter table public.demo_agency_commercial_events enable row level security;
revoke all on public.demo_agency_commercial_state,public.demo_agency_commercial_events from public,anon,authenticated;
insert into public.demo_agency_commercial_state(agency_id)
 select id from public.agencies where is_demo=true on conflict do nothing;

create or replace function public.agency_demo_commercial_snapshot(agency_key uuid,context_key uuid default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); agency_demo boolean; state public.demo_agency_commercial_state%rowtype; items jsonb;
begin
 if actor is null or not (
  exists(select 1 from public.agency_members am where am.agency_id=agency_key and am.user_id=actor and am.active and context_key is null)
  or exists(select 1 from public.platform_operator_contexts ctx join public.platform_memberships pm on pm.user_id=ctx.actor_id
    where ctx.id=context_key and ctx.agency_id=agency_key and ctx.context_type='AGENCY'
    and ctx.closed_at is null and ctx.expires_at>now() and pm.user_id=actor and pm.role='OWNER' and pm.active)
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select a.is_demo into agency_demo from public.agencies a where a.id=agency_key;
 if agency_demo is distinct from true then raise exception 'DEMO_ONLY' using errcode='42501';end if;
 select * into state from public.demo_agency_commercial_state where agency_id=agency_key;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'kind',e.action,'name',m.deceased_name,
 'email',fi.invited_email,'tier',e.tier,'plan',e.plan_code,'amount',e.amount_cents,
 'is_free',e.free_activation,'memorial_id',e.memorial_id,'date',e.created_at)
 order by e.created_at desc),'[]'::jsonb) into items
 from (select * from public.demo_agency_commercial_events where agency_id=agency_key order by created_at desc limit 100) e
 left join public.memorials m on m.id=e.memorial_id
 left join lateral (select f.invited_email from public.family_invites f where f.memorial_id=e.memorial_id order by f.created_at desc limit 1) fi on true;
 return jsonb_build_object('plan',coalesce(state.plan_code,'PAYG'),'free_used',coalesce(state.free_used,0),
 'free_remaining',2-coalesce(state.free_used,0),'events',items);
end $$;

create or replace function public.agency_demo_choose_plan(agency_key uuid,selected_plan text,request_key uuid,context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); demo boolean; agency_status text; previous text; fee int; event_key uuid;
begin
 if actor is null or selected_plan not in ('PAYG','MONTHLY','YEARLY') or request_key is null
 then raise exception 'INVALID_REQUEST' using errcode='22023';end if;
 if not (
  exists(select 1 from public.agency_members am where am.agency_id=agency_key and am.user_id=actor and am.active and context_key is null)
  or exists(select 1 from public.platform_operator_contexts ctx join public.platform_memberships pm on pm.user_id=ctx.actor_id
    where ctx.id=context_key and ctx.agency_id=agency_key and ctx.context_type='AGENCY'
    and ctx.closed_at is null and ctx.expires_at>now() and pm.user_id=actor and pm.role='OWNER' and pm.active)
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select a.is_demo,a.status into demo,agency_status from public.agencies a where a.id=agency_key for update;
 if demo is distinct from true or agency_status<>'ACTIVE' then raise exception 'DEMO_AGENCY_NOT_ACTIVE' using errcode='42501';end if;
 select plan_code into previous from public.demo_agency_commercial_state where agency_id=agency_key for update;
 if previous is null then raise exception 'DEMO_STATE_MISSING' using errcode='22023';end if;
 if exists(select 1 from public.demo_agency_commercial_events where agency_id=agency_key and request_key=agency_demo_choose_plan.request_key)
 then return public.agency_demo_commercial_snapshot(agency_key,context_key);end if;
 if selected_plan is distinct from previous then
  fee:=case selected_plan when 'MONTHLY' then 3990 when 'YEARLY' then 37900 else 0 end;
  update public.demo_agency_commercial_state set plan_code=selected_plan,changed_at=now() where agency_id=agency_key;
  insert into public.demo_agency_commercial_events(agency_id,actor_id,action,plan_code,amount_cents,request_key)
  values(agency_key,actor,'PLAN_SELECTED',selected_plan,fee,request_key) returning id into event_key;
 end if;
 return public.agency_demo_commercial_snapshot(agency_key,context_key);
end $$;

create or replace function public.agency_demo_create_memorial(
 agency_key uuid,person_name text,memorial_tier text,family_email text,request_key uuid,context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); demo boolean; agency_status text; state public.demo_agency_commercial_state%rowtype;
 receiver text:=lower(btrim(coalesce(family_email,''))); person text:=btrim(coalesce(person_name,''));
 created_memorial uuid; code text; num integer; free boolean; amount int;
 token text; invite_key uuid; recent public.demo_agency_commercial_events%rowtype;
begin
 if actor is null or request_key is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if person is null or char_length(person) not between 3 and 180 or memorial_tier not in ('STANDARD','PREMIUM')
 or char_length(receiver)>254 or receiver !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
 then raise exception 'INVALID_MEMORIAL_DATA' using errcode='22023';end if;
 if not (
  exists(select 1 from public.agency_members am where am.agency_id=agency_key and am.user_id=actor and am.active and context_key is null)
  or exists(select 1 from public.platform_operator_contexts ctx join public.platform_memberships pm on pm.user_id=ctx.actor_id
    where ctx.id=context_key and ctx.agency_id=agency_key and ctx.context_type='AGENCY'
    and ctx.closed_at is null and ctx.expires_at>now() and pm.user_id=actor and pm.role='OWNER' and pm.active)
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 -- Lock demo agency and serialize both free accounting and Mxx allocation.
 select a.is_demo,a.status into demo,agency_status from public.agencies a where a.id=agency_key for update;
 if demo is distinct from true or agency_status<>'ACTIVE' then raise exception 'DEMO_AGENCY_NOT_ACTIVE' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtext('memorial_demo_checkout_codes'));
 select * into recent from public.demo_agency_commercial_events
 where agency_id=agency_key and demo_agency_commercial_events.request_key=agency_demo_create_memorial.request_key;
 if found then
  return jsonb_build_object('already_processed',true,'memorial_id',recent.memorial_id,'amount_cents',recent.amount_cents,
   'free_activation',recent.free_activation,'message','Operazione già registrata. Recupera l’invito dalla gestione famiglia.');
 end if;
 select * into state from public.demo_agency_commercial_state where agency_id=agency_key for update;
 if not found then raise exception 'DEMO_STATE_MISSING' using errcode='22023';end if;
 free:=state.free_used<2;
 amount:=case when free then 0 when state.plan_code='PAYG' and memorial_tier='STANDARD' then 1990
 when state.plan_code='PAYG' then 2290 when state.plan_code='MONTHLY' and memorial_tier='STANDARD' then 1390
 when state.plan_code='MONTHLY' then 1690 when memorial_tier='STANDARD' then 1190 else 1490 end;
 select n into num from generate_series(13,99) n
 where not exists(select 1 from public.memorials m where m.is_demo=true and m.demo_code='M'||lpad(n::text,2,'0'))
 order by n limit 1;
 if num is null then raise exception 'DEMO_MEMORIAL_CAP_REACHED' using errcode='22023';end if;
 code:='M'||lpad(num::text,2,'0');
 insert into public.memorials(agency_id,is_demo,demo_code,tier,status,visibility,deceased_name)
 values(agency_key,true,code,memorial_tier,'SKELETON_ACTIVE','UNLISTED',person) returning id into created_memorial;
 insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,highlights)
 values(created_memorial,'','', '[]'::jsonb);
 insert into public.memorial_visual_settings(memorial_id) values(created_memorial);
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.family_invites(memorial_id,invited_email,role,token_hash,expires_at,is_demo)
 values(created_memorial,receiver,'OWNER',encode(sha256(convert_to(token,'UTF8')),'hex'),now()+interval '72 hours',true)
 returning id into invite_key;
 if free then update public.demo_agency_commercial_state set free_used=free_used+1,changed_at=now() where agency_id=agency_key;end if;
 insert into public.demo_agency_commercial_events(
 agency_id,actor_id,action,plan_code,tier,memorial_id,amount_cents,free_activation,request_key)
 values(agency_key,actor,'MEMORIAL_CONFIRMED',state.plan_code,memorial_tier,created_memorial,amount,free,request_key);
 return jsonb_build_object('memorial_id',created_memorial,'demo_code',code,'family_invite_token',token,
 'family_invite_id',invite_key,'family_email',receiver,'family_link_created',true,
 'amount_cents',amount,'free_activation',free,'free_remaining',2-state.free_used-(case when free then 1 else 0 end),
 'plan',state.plan_code,'payment_status',case when free then 'FREE' else 'SIMULATED' end);
end $$;
revoke all on function public.agency_demo_commercial_snapshot(uuid,uuid) from public,anon,authenticated;
revoke all on function public.agency_demo_choose_plan(uuid,text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.agency_demo_create_memorial(uuid,text,text,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.agency_demo_commercial_snapshot(uuid,uuid) to authenticated;
grant execute on function public.agency_demo_choose_plan(uuid,text,uuid,uuid) to authenticated;
grant execute on function public.agency_demo_create_memorial(uuid,text,text,text,uuid,uuid) to authenticated;
