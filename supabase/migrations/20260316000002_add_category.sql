-- Add category column to beats for organizing by vibe
alter table beats add column category text default 'boom-bap'
  check (category in ('boom-bap', 'trap', 'chill', 'dark', 'hype'));
