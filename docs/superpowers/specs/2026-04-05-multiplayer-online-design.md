# Multiplayer Online Mode — Design Spec

## Overview

Add online multiplayer to Flip 7. Frontend stays on GitHub Pages, backend on Supabase (free tier). Players create/join rooms via 4-digit numeric codes, each submitting scores from their own device. The room creator (host) can submit scores on behalf of absent players. Rounds auto-advance when all players have submitted. Game auto-closes when a player reaches 200 points; host can restart.

## Identity & Sessions

- No Supabase Auth — use Supabase anonymous access
- On create/join, generate a UUID `session_token`, store in localStorage
- Pass session token in queries to identify the player
- Survives page refresh — on reload, check localStorage for session, rejoin room

## Animal Emoji Avatars

Pool of ~30 animal emojis, randomly assigned (no duplicates within a room):

```
🦊🐼🦁🐯🐨🐸🦄🐙🦋🐬🦈🐢🦉🐝🐺🦎🐧🐘🦩🐳🦜🐿️🦔🐾🦀🐌🦚🐠🦧🐫
```

## Supabase Schema

### Tables

**rooms**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| code | text unique | 4-digit numeric string |
| player_count | int | Expected number of players (2-12) |
| status | text | `waiting`, `playing`, `finished` |
| current_round | int | Current round number, starts at 1 |
| created_at | timestamptz | Default `now()` |

**players**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| room_id | uuid FK→rooms | |
| name | text | Player-chosen display name |
| emoji | text | Randomly assigned animal emoji |
| is_host | bool | True for room creator |
| session_token | uuid unique | Stored in localStorage for identity |
| created_at | timestamptz | Default `now()` |

**scores**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Default `gen_random_uuid()` |
| room_id | uuid FK→rooms | |
| round_number | int | Which round this score is for |
| player_id | uuid FK→players | Who the score belongs to |
| score | int | The score value |
| submitted_by | uuid FK→players | Who submitted it (may differ from player_id if host fills for someone) |
| created_at | timestamptz | Default `now()` |

### Row Level Security

- **rooms**: Anyone can read. Anyone can insert. Only host can update status.
- **players**: Anyone can read players in their room. Anyone can insert (join).
- **scores**: Anyone in the room can read. Players can insert their own score. Host can insert for any player in the room.

### Realtime

Enable Realtime on:
- `players` — lobby join updates
- `scores` — live score submissions
- `rooms` — status changes (waiting→playing→finished)

## Game Flow

### 1. Create Room
1. User navigates to `#/flip7/online/create`
2. Random animal emoji displayed as avatar
3. User enters their name and selects player count (2-12)
4. On submit:
   - Generate 4-digit room code (check uniqueness via query)
   - Insert into `rooms` with status=`waiting`
   - Generate UUID session_token, store in localStorage
   - Insert into `players` with is_host=true
   - Navigate to `#/flip7/online/room/{code}`

### 2. Join Room
1. User navigates to `#/flip7/online/join` (or `#/flip7/online/join?code=XXXX`)
2. Enter room code + pick name
3. Random animal emoji assigned (excluding emojis already used in room)
4. On submit:
   - Validate room exists and status=`waiting` and not full
   - Generate UUID session_token, store in localStorage
   - Insert into `players`
   - Navigate to `#/flip7/online/room/{code}`

### 3. Lobby
1. Room page shows room code prominently, player list via Realtime subscription
2. Each player appears with emoji + name; host has "Host" badge
3. When `players` count equals `rooms.player_count`:
   - Host auto-triggers: update room status to `playing`, set current_round=1
   - All clients see status change via Realtime → transition to game view

### 4. Gameplay
1. **Scoreboard** displays current rankings (reuse existing Scoreboard component with adapted data)
2. **Score submission**: Each player sees a single input for their own score + submit button
3. **Waiting indicator**: Shows which players haven't submitted yet for current round
4. **Host extra**: Below own score input, host sees inputs for all players who haven't submitted, with a "Submit for Others" button
5. **Auto-advance**: When all scores for current round are in:
   - Check if any player total ≥ 200
   - If yes → update room status to `finished`
   - If no → increment `rooms.current_round`, clients see new round via Realtime

### 5. Game Over
1. Room status changes to `finished`
2. Winner banner + final scoreboard displayed (reuse existing Scoreboard)
3. Share button works same as local mode (encode state in URL → tinyurl)
4. Host sees "New Game" button → clears scores, resets current_round=1, status=`playing`

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `#/flip7/online/create` | OnlineCreate | Create room flow |
| `#/flip7/online/join` | OnlineJoin | Join room flow |
| `#/flip7/online/room/:code` | OnlineRoom | Lobby + gameplay |

## Home Page Changes

Add to the Flip 7 game card on the home page:
- "Local Game" button → navigates to `#/flip7` (existing)
- "Online Game" section with "Create Room" and "Join Room" buttons

## Files to Create

1. **`src/lib/supabase.ts`** — Supabase client initialization with env vars
2. **`src/types/online.ts`** — Online-specific types (Room, OnlinePlayer, Score, etc.)
3. **`src/pages/OnlineCreate.tsx`** — Create room page (name input, player count, emoji display)
4. **`src/pages/OnlineJoin.tsx`** — Join room page (room code input, name input, emoji display)
5. **`src/pages/OnlineRoom.tsx`** — Main orchestrator: lobby → game → game over
6. **`src/components/Lobby.tsx`** — Waiting room UI with player list
7. **`src/components/OnlineScoreInput.tsx`** — Own score input + host fill-for-others
8. **`supabase/schema.sql`** — Full SQL for tables, RLS policies, Realtime enable

## Files to Modify

1. **`src/pages/Home.tsx`** — Add Online Game section with Create/Join buttons
2. **`src/App.tsx`** — Add online routes
3. **`package.json`** — Add `@supabase/supabase-js` dependency
4. **`src/components/Scoreboard.tsx`** — No changes needed; reuse as-is with adapted GameState

## Supabase Setup Instructions

1. Create a new Supabase project
2. Run `supabase/schema.sql` in SQL Editor to create tables + RLS + Realtime
3. Copy the project URL and anon key
4. Set environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Edge Cases

- **Room full**: Reject join attempt with "Room is full" message
- **Duplicate room code**: Retry code generation (loop until unique)
- **Player refreshes**: localStorage session_token allows auto-rejoin
- **Player disconnects permanently**: Host can fill their scores; they just show as "not submitted"
- **Host leaves**: Game continues — other players can still submit their own scores, but nobody can fill for others
- **Stale rooms**: Accumulate in DB (tiny footprint). Could add cleanup later but not needed for free tier usage.
- **Race condition on round advance**: Use Supabase count query — check `scores` count for current round equals `player_count` before advancing. Only host's client triggers the room update.
