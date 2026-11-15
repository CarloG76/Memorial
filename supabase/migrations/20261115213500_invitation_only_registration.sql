-- Invitation-only B2B onboarding. Public self-provisioning RPC no longer executable.
revoke execute on function public.complete_agency_registration(text,text,text,text) from public,anon,authenticated;
