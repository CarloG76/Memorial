-- Applied to Memorial project as 20261020220855_m1_private_agency_registration_rpc.
-- Only a security-invoker RPC remains exposed in public.
alter function public.complete_agency_registration(text,text,text,text) set schema app_private;
revoke all on function app_private.complete_agency_registration(text,text,text,text)
 from public,anon,authenticated;
grant execute on function app_private.complete_agency_registration(text,text,text,text)
 to authenticated;
create function public.complete_agency_registration(
 p_legal_name text,p_vat_number text,p_terms_version text,p_privacy_version text
) returns uuid language sql security invoker set search_path=''
as $$
 select app_private.complete_agency_registration(
  p_legal_name,p_vat_number,p_terms_version,p_privacy_version
 );
$$;
revoke all on function public.complete_agency_registration(text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.complete_agency_registration(text,text,text,text)
 to authenticated;
