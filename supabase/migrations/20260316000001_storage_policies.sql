-- Storage policies for audio bucket
create policy "audio_public_read" on storage.objects for select using (bucket_id = 'audio');
create policy "audio_auth_insert" on storage.objects for insert with check (bucket_id = 'audio' and auth.role() = 'authenticated');
