-- M1 RLS regression — run only against disposable PostgreSQL 17 after M1 migration.
-- Real database roles are SET LOCAL, so assertions DO NOT run as postgres/superuser.
-- Test users are synthetic UUIDs and have no external identities.
\set ON_ERROR_STOP on

INSERT INTO auth.users(id) VALUES
('00000000-0000-4000-8000-000000000001'), -- platform owner
('00000000-0000-4000-8000-000000000002'), -- platform admin
('00000000-0000-4000-8000-000000000003'), -- finance
('00000000-0000-4000-8000-000000000004'), -- support
('00000000-0000-4000-8000-000000000011'), -- agency A owner
('00000000-0000-4000-8000-000000000012'), -- agency A operator
('00000000-0000-4000-8000-000000000021'), -- agency B owner
('00000000-0000-4000-8000-000000000031'), -- memorial A family owner
('00000000-0000-4000-8000-000000000032'), -- memorial A family editor
('00000000-0000-4000-8000-000000000041'); -- memorial B family viewer

INSERT INTO public.platform_memberships(user_id,role) VALUES
('00000000-0000-4000-8000-000000000001','OWNER'),
('00000000-0000-4000-8000-000000000002','ADMIN'),
('00000000-0000-4000-8000-000000000003','FINANCE'),
('00000000-0000-4000-8000-000000000004','SUPPORT');

INSERT INTO public.agencies(id,legal_name) VALUES
('10000000-0000-4000-8000-000000000001','Synthetic Agency A'),
('10000000-0000-4000-8000-000000000002','Synthetic Agency B');

INSERT INTO public.agency_members(agency_id,user_id,role) VALUES
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','OWNER'),
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000012','OPERATOR'),
('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000021','OWNER');

INSERT INTO public.memorials(id,agency_id) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');

INSERT INTO public.family_members(memorial_id,user_id,role,can_edit_content,can_moderate) VALUES
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000031','OWNER',true,true),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000032','EDITOR',true,false),
('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000041','VIEWER',false,false);

INSERT INTO public.family_invites(memorial_id,invited_email,role,token_hash,expires_at)
VALUES ('20000000-0000-4000-8000-000000000001','synthetic-only@example.invalid','EDITOR','synthetic-hash-not-a-token',now() + interval '1 day');

-- Test 1: unverified visitor has no direct table privileges and no data.
BEGIN;
SET LOCAL ROLE anon;
DO $test$
BEGIN
  IF has_table_privilege('anon','public.agencies','SELECT')
    OR has_table_privilege('anon','public.memorials','SELECT')
    OR has_table_privilege('anon','public.family_invites','SELECT')
  THEN RAISE EXCEPTION 'Anon has unintended SELECT grant'; END IF;
  BEGIN
    PERFORM count(*) FROM public.agencies;
    RAISE EXCEPTION 'Anon was able to query agencies';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;
ROLLBACK;

-- Test 2: owner of Agency A sees only own tenant, not family private roster.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated"}', true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM public.agencies) <> 1 THEN
    RAISE EXCEPTION 'Agency A owner could list other agencies'; END IF;
  IF (SELECT count(*) FROM public.memorials) <> 1 THEN
    RAISE EXCEPTION 'Agency A owner could list other memorials'; END IF;
  IF (SELECT count(*) FROM public.agency_members) <> 2 THEN
    RAISE EXCEPTION 'Agency A owner could not list own operator'; END IF;
  IF (SELECT count(*) FROM public.family_members) <> 0 THEN
    RAISE EXCEPTION 'Agency owner can read private family memberships'; END IF;
  BEGIN
    UPDATE public.agencies SET legal_name='ATTACK' WHERE legal_name='Synthetic Agency B';
    RAISE EXCEPTION 'Agency owner updated table without write permission';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;
ROLLBACK;

-- Test 3: Agency B does not inherit Agency A resources.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000021","role":"authenticated"}', true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM public.agencies WHERE legal_name='Synthetic Agency B') <> 1
     OR (SELECT count(*) FROM public.agencies WHERE legal_name='Synthetic Agency A') <> 0
  THEN RAISE EXCEPTION 'Cross agency registry exposure'; END IF;
  IF (SELECT count(*) FROM public.memorials WHERE agency_id='10000000-0000-4000-8000-000000000001') <> 0
  THEN RAISE EXCEPTION 'Cross agency memorial exposure'; END IF;
END $test$;
ROLLBACK;

-- Test 4: family owner sees own memorial + members, but no agency registry.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}', true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM public.memorials) <> 1
    OR (SELECT count(*) FROM public.agencies) <> 0
    OR (SELECT count(*) FROM public.family_members) <> 2
  THEN RAISE EXCEPTION 'Family owner membership boundary violation'; END IF;
  IF (SELECT count(*) FROM public.family_members WHERE memorial_id='20000000-0000-4000-8000-000000000002') <> 0
  THEN RAISE EXCEPTION 'Family owner saw another family'; END IF;
END $test$;
ROLLBACK;

-- Test 5: family editor can only see own membership, not edit privileges.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000032","role":"authenticated"}', true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM public.memorials) <> 1 OR
    (SELECT count(*) FROM public.family_members) <> 1
  THEN RAISE EXCEPTION 'Editor scope violation'; END IF;
  BEGIN
    UPDATE public.family_members SET role='OWNER';
    RAISE EXCEPTION 'Editor escalated role';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;
ROLLBACK;

-- Test 6: B family viewer cannot see A or elevate self.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000041","role":"authenticated"}', true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM public.memorials) <> 1 OR
     (SELECT count(*) FROM public.memorials WHERE agency_id='10000000-0000-4000-8000-000000000001') <> 0 OR
     (SELECT count(*) FROM public.family_members) <> 1
  THEN RAISE EXCEPTION 'Viewer scope violation'; END IF;
  BEGIN
    INSERT INTO public.platform_memberships(user_id,role)
      VALUES ('00000000-0000-4000-8000-000000000041','OWNER');
    RAISE EXCEPTION 'Viewer self-assigned staff privileges';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;
ROLLBACK;

-- Test 7: platform ADMIN can inspect agencies but not family/memorial private data.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM public.agencies) <> 2 OR
    (SELECT count(*) FROM public.memorials) <> 0 OR
    (SELECT count(*) FROM public.family_members) <> 0
  THEN RAISE EXCEPTION 'Platform ADMIN privacy boundary violated'; END IF;
END $test$;
ROLLBACK;

-- Test 8: FINANCE and SUPPORT cannot list agencies or private memorials.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM public.agencies) <> 0 OR (SELECT count(*) FROM public.memorials) <> 0
  THEN RAISE EXCEPTION 'FINANCE read unauthorized tenant'; END IF;
END $test$;
ROLLBACK;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
DO $test$
BEGIN
  IF (SELECT count(*) FROM public.agencies) <> 0 OR (SELECT count(*) FROM public.memorials) <> 0
  THEN RAISE EXCEPTION 'SUPPORT read unauthorized tenant'; END IF;
END $test$;
ROLLBACK;

-- Test 9: invites / tokens aren't available to authenticated API users.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}', true);
DO $test$
BEGIN
  IF has_table_privilege('authenticated','public.family_invites','SELECT')
  THEN RAISE EXCEPTION 'Auth role can read family invitations'; END IF;
  BEGIN
    PERFORM count(*) FROM public.family_invites;
    RAISE EXCEPTION 'Invitations are readable';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $test$;
ROLLBACK;

\echo 'M1 cross-tenant RLS assertions passed (disposable test database only)'
