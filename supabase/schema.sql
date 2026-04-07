-- Rooms table
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  player_count int not null check (player_count between 2 and 12),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  current_round int not null default 0,
  created_at timestamptz not null default now()
);

-- Players table
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  emoji text not null,
  is_host boolean not null default false,
  session_token uuid unique not null,
  created_at timestamptz not null default now()
);

-- Scores table
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number int not null,
  player_id uuid not null references players(id) on delete cascade,
  score int not null,
  submitted_by uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(room_id, round_number, player_id)
);

-- Indexes
create index if not exists idx_players_room_id on players(room_id);
create index if not exists idx_players_session_token on players(session_token);
create index if not exists idx_scores_room_id on scores(room_id);
create index if not exists idx_scores_round on scores(room_id, round_number);

-- Enable Row Level Security
alter table rooms enable row level security;
alter table players enable row level security;
alter table scores enable row level security;

-- RLS Policies: rooms
create policy "Anyone can read rooms" on rooms for select using (true);
create policy "Anyone can create rooms" on rooms for insert with check (true);
create policy "Anyone can update rooms" on rooms for update using (true);

-- RLS Policies: players
create policy "Anyone can read players" on players for select using (true);
create policy "Anyone can join rooms" on players for insert with check (true);

-- RLS Policies: scores
create policy "Anyone can read scores" on scores for select using (true);
create policy "Anyone can insert scores" on scores for insert with check (true);

-- Enable Realtime
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table scores;
