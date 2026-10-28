create or replace function public.platform_get_change_log_page(page_number integer default 0,page_size integer default 100)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare entries jsonb;total_rows bigint;safe_page integer:=least(greatest(coalesce(page_number,0),0),1000000);safe_size integer:=least(greatest(coalesce(page_size,100),10),100);
begin
 if not exists(select 1 from public.platform_memberships pm where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select count(*) into total_rows from public.platform_change_log;
 select coalesce(jsonb_agg(jsonb_build_object(
 'id',l.id,'at',l.changed_at,'table',l.table_name,'action',l.operation,
 'record',l.record_key,'agency_id',l.agency_id,'memorial_id',l.memorial_id,
 'is_demo',l.is_demo,'actor',l.actor_id,'source',l.source_role,
 'before',l.before_data,'after',l.after_data) order by l.changed_at desc,l.id desc),'[]'::jsonb)
 into entries
 from (select * from public.platform_change_log
 order by changed_at desc,id desc limit safe_size offset (safe_page::bigint*safe_size::bigint)) l;
 return jsonb_build_object('events',entries,'total',total_rows,'page',safe_page,'page_size',safe_size);
end $$;
revoke all on function public.platform_get_change_log_page(integer,integer) from public,anon,authenticated;
grant execute on function public.platform_get_change_log_page(integer,integer) to authenticated;
