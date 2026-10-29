-- Make contextual opening/closing and each delegated action visible in SuperAdmin's
-- existing global, paginated audit without granting table reads to clients.
drop trigger if exists platform_audit_capture on public.platform_operator_contexts;
create trigger platform_audit_capture
after insert or update or delete on public.platform_operator_contexts
for each row execute function app_private.capture_platform_change();
drop trigger if exists platform_audit_capture on public.platform_operator_context_events;
create trigger platform_audit_capture
after insert on public.platform_operator_context_events
for each row execute function app_private.capture_platform_change();

-- Immutable events: no user-facing UPDATE or DELETE RPC exists; block even privileged
-- accidental writes except through carefully versioned migrations.
create or replace function app_private.reject_operator_event_changes()
returns trigger language plpgsql set search_path=''
as $$
begin
 raise exception 'OPERATOR_EVENTS_APPEND_ONLY' using errcode='42501';
end $$;
drop trigger if exists prevent_operator_event_mutation on public.platform_operator_context_events;
create trigger prevent_operator_event_mutation
before update or delete on public.platform_operator_context_events
for each row execute function app_private.reject_operator_event_changes();
revoke all on function app_private.reject_operator_event_changes() from public,anon,authenticated;
