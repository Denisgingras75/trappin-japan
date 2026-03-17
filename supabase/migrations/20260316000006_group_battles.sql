-- Group battles, tagging, beat metadata

-- Battle participants (supports 2+ people in a battle)
create table battle_participants (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references battles(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text default 'participant' check (role in ('creator', 'participant')),
  joined_at timestamptz default now(),
  unique(battle_id, user_id)
);

create index idx_bp_battle on battle_participants(battle_id);
create index idx_bp_user on battle_participants(user_id);

-- Max participants per battle (null = unlimited)
alter table battles add column max_participants integer;

-- Targets: who you're dissing in this freestyle
alter table freestyles add column targets uuid[] default '{}';

-- Beat metadata for search/filter
alter table beats add column bpm integer;
alter table beats add column mood text;
alter table beats add column energy text;

-- Backfill existing battles into battle_participants
insert into battle_participants (battle_id, user_id, role)
select id, challenger_id, 'creator' from battles where challenger_id is not null
on conflict do nothing;

insert into battle_participants (battle_id, user_id, role)
select id, opponent_id, 'participant' from battles where opponent_id is not null
on conflict do nothing;

-- RLS for battle_participants
alter table battle_participants enable row level security;
create policy "bp_select" on battle_participants for select using (true);
create policy "bp_insert" on battle_participants for insert with check (auth.uid() = user_id);

-- Update battles RLS to include participants
drop policy if exists "battles_select" on battles;
create policy "battles_select" on battles for select using (
  status = 'open' or
  challenger_id = auth.uid() or
  opponent_id = auth.uid() or
  exists (select 1 from battle_participants where battle_id = id and user_id = auth.uid())
);

-- Update freestyles RLS to include participants
drop policy if exists "freestyles_select" on freestyles;
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
