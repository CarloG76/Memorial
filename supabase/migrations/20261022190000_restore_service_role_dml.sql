-- Restore Supabase administrative service_role DML privileges accidentally revoked
-- by M1's blanket table REVOKE (which included 'public' inherited grants).
-- service_role has BYPASSRLS but STILL needs explicit SQL table privileges.
-- Never grant these privileges to anon or authenticated.
grant select, insert, update, delete on table
 public.profiles,
 public.platform_memberships,
 public.agencies,
 public.agency_members,
 public.memorials,
 public.family_members,
 public.family_invites
to service_role;
