
create table if not exists public.platform_change_log(
 id bigint generated always as identity primary key,
 changed_at timestamptz not null default now(),
 table_name text not null,
 operation text not null check(operation in ('INSERT','UPDATE','DELETE')),
 record_key text not null,
 agency_id uuid,
 memorial_id uuid,
 is_demo boolean,
 actor_id uuid,
 source_role text not null,
 before_data jsonb,
 after_data jsonb,
 transaction_id bigint not null default txid_current()
);
create index if not exists platform_change_log_latest_idx on public.platform_change_log(changed_at desc,id desc);
create index if not exists platform_change_log_memorial_idx on public.platform_change_log(memorial_id,changed_at desc);
create index if not exists platform_change_log_agency_idx on public.platform_change_log(agency_id,changed_at desc);
alter table public.platform_change_log enable row level security;
revoke all on public.platform_change_log from public,anon,authenticated;

create or replace function app_private.capture_platform_change()
returns trigger language plpgsql security definer set search_path=''
as $$
declare old_row jsonb;new_row jsonb;ref jsonb;mid uuid;aid uuid;demo boolean;
begin
 old_row:=case when tg_op='INSERT' then null else to_jsonb(old) end;
 new_row:=case when tg_op='DELETE' then null else to_jsonb(new) end;
 if tg_op='UPDATE' and old_row=new_row then return new;end if;
 ref:=coalesce(new_row,old_row);
 mid:=nullif(ref->>'memorial_id','')::uuid;
 aid:=nullif(ref->>'agency_id','')::uuid;
 if tg_table_name='memorials' then mid:=nullif(ref->>'id','')::uuid;end if;
 if tg_table_name='agencies' then aid:=nullif(ref->>'id','')::uuid;end if;
 demo:=nullif(ref->>'is_demo','')::boolean;
 if mid is not null and (aid is null or demo is null) then
  select coalesce(aid,m.agency_id),coalesce(demo,m.is_demo) into aid,demo from public.memorials m where m.id=mid;
 end if;
 if aid is not null and demo is null then
  select a.is_demo into demo from public.agencies a where a.id=aid;
 end if;
 insert into public.platform_change_log(table_name,operation,record_key,agency_id,memorial_id,is_demo,actor_id,source_role,before_data,after_data)
 values(tg_table_name,tg_op,coalesce(ref->>'id',ref->>'memorial_id',ref->>'user_id',ref->>'agency_id','unknown'),
 aid,mid,demo,auth.uid(),coalesce(nullif(current_setting('request.jwt.claim.role',true),''),current_user),
 old_row,new_row);
 if tg_op='DELETE' then return old;end if;
 return new;
end $$;
revoke all on function app_private.capture_platform_change() from public,anon,authenticated;

do $$
declare t text;
begin
 foreach t in array array[
 'agencies','agency_members','memorials','family_members','memorial_memories','memorial_thoughts',
 'memorial_public_demo_profiles','memorial_public_demo_photos','memorial_visual_settings',
 'memorial_background_presets','profiles','platform_memberships']
 loop
  execute format('drop trigger if exists platform_audit_capture on public.%I',t);
  execute format('create trigger platform_audit_capture after insert or update or delete on public.%I for each row execute function app_private.capture_platform_change()',t);
 end loop;
end $$;

create or replace function public.platform_get_change_log(max_results integer default 100)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if not exists(select 1 from public.platform_memberships pm where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object(
 'id',l.id,'at',l.changed_at,'table',l.table_name,'action',l.operation,
 'record',l.record_key,'agency_id',l.agency_id,'memorial_id',l.memorial_id,
 'is_demo',l.is_demo,'actor',l.actor_id,'source',l.source_role,'before',l.before_data,'after',l.after_data)
 order by l.changed_at desc,l.id desc),'[]'::jsonb) into result
 from (select * from public.platform_change_log order by changed_at desc,id desc limit least(greatest(coalesce(max_results,100),1),200)) l;
 return result;
end $$;
revoke all on function public.platform_get_change_log(integer) from public,anon,authenticated;
grant execute on function public.platform_get_change_log(integer) to authenticated;
