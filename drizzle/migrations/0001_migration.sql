-- Uploaded files live in the private "uploads" bucket; only active workspace members can manage them.
create policy "Members read uploads" on storage.objects for select to authenticated
  using (bucket_id = 'uploads' and public.is_workspace_member(auth.uid()));
create policy "Members add uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and public.is_workspace_member(auth.uid()));
create policy "Members replace uploads" on storage.objects for update to authenticated
  using (bucket_id = 'uploads' and public.is_workspace_member(auth.uid()))
  with check (bucket_id = 'uploads' and public.is_workspace_member(auth.uid()));
create policy "Members delete uploads" on storage.objects for delete to authenticated
  using (bucket_id = 'uploads' and public.is_workspace_member(auth.uid()));