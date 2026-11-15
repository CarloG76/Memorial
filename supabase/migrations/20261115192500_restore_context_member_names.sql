-- Preserve the previously available names in contextual agency and family panels.
create or replace function public.platform_get_operator_context(context_key uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); ctx public.platform_operator_contexts%rowtype; result jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.closed_at is null and c.expires_at>now();
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 if ctx.context_type='AGENCY' then
 select jsonb_build_object(
  'context_id',ctx.id,'kind','AGENCY','expires_at',ctx.expires_at,
  'agency',jsonb_build_object('id',a.id,'legal_name',a.legal_name,'city',a.city,'country_code',a.country_code,
   'vat_number',a.vat_number,'contact_email',a.contact_email,'plan',a.plan,'status',a.status,'is_demo',a.is_demo),
  'memorials',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'name',m.deceased_name,'status',m.status,'tier',m.tier,'is_demo',m.is_demo)
    order by m.created_at desc) from public.memorials m where m.agency_id=a.id),'[]'::jsonb),
  'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',am.user_id,'role',am.role,'active',am.active,'display_name',coalesce((select pf.display_name from public.profiles pf where pf.user_id=am.user_id),'')))
    from public.agency_members am where am.agency_id=a.id),'[]'::jsonb))
 into result from public.agencies a where a.id=ctx.agency_id;
 else
 select jsonb_build_object(
  'context_id',ctx.id,'kind','FAMILY','expires_at',ctx.expires_at,
  'memorial',jsonb_build_object('id',m.id,'agency_id',m.agency_id,'name',m.deceased_name,
     'tier',m.tier,'status',m.status,'visibility',m.visibility,'is_demo',m.is_demo,'birth_date',m.birth_date,'death_date',m.death_date),
  'agency',jsonb_build_object('id',a.id,'legal_name',a.legal_name),
  'presentation',jsonb_build_object('name',m.deceased_name,'dedication',coalesce(p.dedication,''),'biography',coalesce(p.biography,''),'story',coalesce(p.story,''),'highlights',coalesce(p.highlights,'[]'::jsonb),
     'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x,'background',coalesce(v.published_preset,'montagna')),
  'backgrounds',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'image_url',b.image_url) order by b.sort_order)
     from public.memorial_background_presets b where b.active),'[]'::jsonb),
  'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',fm.user_id,'role',fm.role,'active',fm.active,'display_name',coalesce((select pf.display_name from public.profiles pf where pf.user_id=fm.user_id),''),
     'can_moderate',fm.can_moderate,'can_edit_content',fm.can_edit_content))
     from public.family_members fm where fm.memorial_id=m.id),'[]'::jsonb),
  'thoughts',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'author',t.author_name,'body',t.body,'status',t.moderation_status)
     order by t.created_at desc) from public.memorial_thoughts t where t.memorial_id=m.id),'[]'::jsonb),
  'memories',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'body',r.body,'status',r.moderation_status)
     order by r.created_at desc) from public.memorial_memories r where r.memorial_id=m.id and r.visitor_submitted=false),'[]'::jsonb))
 into result from public.memorials m
 join public.agencies a on a.id=m.agency_id
 left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 left join public.memorial_visual_settings v on v.memorial_id=m.id
 where m.id=ctx.memorial_id;
 end if;
 if result is null then raise exception 'TARGET_NOT_FOUND' using errcode='22023';end if;
 return result;
end $$;
