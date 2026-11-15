-- Correct the private/public object path check: literal dot is [.] (no escaping ambiguity).
alter table public.memorial_memories drop constraint if exists visitor_memory_file_paths;
alter table public.memorial_memories add constraint visitor_memory_file_paths check (
 (photo_private_path is null or photo_private_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$')
 and (photo_public_path is null or photo_public_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$')
);
