-- Freestyle App Schema

-- Beats library
create table beats (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  audio_url text not null,
  uploaded_by uuid references auth.users(id),
  is_curated boolean default false,
  category text,
  bpm integer,
  mood text,
  energy text,
  created_at timestamptz default now()
);

-- Battles (async back-and-forth, supports groups)
create table battles (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references auth.users(id),
  opponent_id uuid references auth.users(id),
  beat_id uuid not null references beats(id),
  share_code text unique not null,
  status text default 'open' check (status in ('open', 'active', 'complete')),
  max_participants integer,
  created_at timestamptz default now()
);

-- Battle participants (supports 2+ people)
create table battle_participants (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references battles(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text default 'participant' check (role in ('creator', 'participant')),
  joined_at timestamptz default now(),
  unique(battle_id, user_id)
);

-- Individual freestyle recordings (voice-only, beat mixed on playback)
create table freestyles (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references battles(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  audio_url text not null,
  round_number integer not null default 1,
  targets uuid[] default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index idx_battles_challenger on battles(challenger_id);
create index idx_battles_opponent on battles(opponent_id);
create index idx_battles_share_code on battles(share_code);
create index idx_freestyles_battle on freestyles(battle_id);
create index idx_beats_curated on beats(is_curated) where is_curated = true;
create index idx_bp_battle on battle_participants(battle_id);
create index idx_bp_user on battle_participants(user_id);

-- RLS policies
alter table beats enable row level security;
alter table battles enable row level security;
alter table freestyles enable row level security;
alter table battle_participants enable row level security;

-- Beats: anyone can read, authenticated users can insert their own
create policy "beats_select" on beats for select using (true);
create policy "beats_insert" on beats for insert with check (auth.uid() = uploaded_by);

-- Battle participants: anyone can read, authenticated users can join
create policy "bp_select" on battle_participants for select using (true);
create policy "bp_insert" on battle_participants for insert with check (auth.uid() = user_id);

-- Battles: participants can read, authenticated users can create
create policy "battles_select" on battles for select using (
  status = 'open' or
  challenger_id = auth.uid() or
  opponent_id = auth.uid() or
  exists (select 1 from battle_participants where battle_id = id and user_id = auth.uid())
);
create policy "battles_insert" on battles for insert with check (auth.uid() = challenger_id);
create policy "battles_update" on battles for update using (
  status = 'open' and opponent_id is null
);

-- Freestyles: battle participants can read, own user can insert
create policy "freestyles_select" on freestyles for select using (
  exists (
    select 1 from battles
    where battles.id = freestyles.battle_id
    and (
      battles.challenger_id = auth.uid() or
      battles.opponent_id = auth.uid() or
      exists (select 1 from battle_participants where battle_id = battles.id and user_id = auth.uid())
    )
  )
);
create policy "freestyles_insert" on freestyles for insert with check (auth.uid() = user_id);

-- Storage bucket (run manually in Supabase dashboard or via API)
-- create a bucket called 'audio' with public access
