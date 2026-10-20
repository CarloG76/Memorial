-- Disposable PostgreSQL 17 CI ONLY. Never execute this in Supabase or production.
-- Provides only the Supabase auth objects used by the M1 candidate schema.
-- No real users, secrets, email addresses or service-role keys.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
REVOKE ALL ON SCHEMA auth FROM PUBLIC;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text,
  email_confirmed_at timestamptz
);

CREATE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE SET search_path = ''
AS $func$
  SELECT (NULLIF(current_setting('request.jwt.claims', true),'')::jsonb ->> 'sub')::uuid;
$func$;

REVOKE ALL ON FUNCTION auth.uid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
