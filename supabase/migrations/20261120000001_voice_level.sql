-- Per-take playback trim: the voice level is metered while recording and
-- this brings every take to the same loudness against the beat.
-- Null (older takes) keeps the fixed mix. Additive only.
alter table freestyles add column if not exists voice_gain_db numeric;

notify pgrst, 'reload schema';
