-- Allow guests (not-logged-in users) to read battles and freestyles.
-- Battles are protected by an unguessable random share_code in the URL, so
-- anyone with the link can view. This matches the intent of the share flow —
-- your boys should be able to tap the link and listen without signing in.

drop policy if exists "battles_select" on battles;
create policy "battles_select" on battles for select using (true);

drop policy if exists "freestyles_select" on freestyles;
create policy "freestyles_select" on freestyles for select using (true);

-- Keep writes locked down to authenticated participants (unchanged):
--   battles_insert → challenger_id = auth.uid()
--   battles_update → status = 'open' and opponent_id is null
--   freestyles_insert → user_id = auth.uid()
