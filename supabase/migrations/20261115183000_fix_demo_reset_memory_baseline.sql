-- Baseline predates visitor memory photo attributes. Populate defaults needed by restore.
update app_private.demo_reset_baseline
set rows=(
 select coalesce(jsonb_agg(
  item || jsonb_build_object('visitor_submitted',coalesce((item->>'visitor_submitted')::boolean,false))
 ),'[]'::jsonb) from jsonb_array_elements(rows) item)
where table_name='memorial_memories';
