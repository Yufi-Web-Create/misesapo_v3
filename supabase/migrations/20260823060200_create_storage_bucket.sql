-- File storage: a single private bucket, objects path-namespaced by case id
-- (`{case_id}/{file_id}-{filename}`) so RLS can reuse private.is_case_participant().

insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', false)
on conflict (id) do nothing;

create policy case_files_select_participant on storage.objects
  for select using (
    bucket_id = 'case-files'
    and private.is_case_participant((storage.foldername(name))[1]::uuid)
  );

create policy case_files_insert_participant on storage.objects
  for insert with check (
    bucket_id = 'case-files'
    and private.is_case_participant((storage.foldername(name))[1]::uuid)
  );

-- No update/delete policy: uploaded files are immutable from the client. A new
-- version is a new file_assets row / new storage object, matching the
-- append-only pattern used for deliverable versions.
