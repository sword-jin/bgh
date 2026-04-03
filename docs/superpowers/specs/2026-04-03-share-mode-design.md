# Share Mode — Design Spec

## Overview

Add a share feature to the Board Game Helper. When a game finishes, a "Share" button appears. Clicking it encodes the final game state into a URL and redirects the browser to is.gd (a free short URL service with a rich web UI) to generate a shareable link. Recipients opening the shared link see a read-only Scoreboard with the game results.

## URL Encoding

### Data Format

Encode `GameState` into a compact string to keep URLs short:

```
playerName1,playerName2|colorIndex1,colorIndex2|r1p1,r1p2;r2p1,r2p2
```

- **Segment 1** (pipe-delimited): Player names, comma-separated
- **Segment 2**: Color indices into `PLAYER_COLORS`, comma-separated
- **Segment 3**: Rounds, semicolon-separated; each round has comma-separated scores per player

Example for a 3-player, 4-round game:
```
Alice,Bob,Charlie|0,1,2|45,40,30;50,55,35;60,45,40;60,40,40
```

This string is then base64-encoded (using `btoa` / `atob` with URI-safe encoding) and placed as the `d` query parameter.

### Functions

In `src/types/game.ts`:

- `encodeGameState(state: GameState): string` — returns base64-encoded compact string
- `decodeGameState(encoded: string): GameState | null` — returns parsed GameState or null on invalid input

## Routing

### New Route

`#/flip7/share?d=BASE64_DATA`

In `App.tsx`, the hash router parses this route and renders the Flip7 page in share mode. The `d` parameter is passed through.

### Share URL Construction

The full share URL is:
```
{window.location.origin}{window.location.pathname}#/flip7/share?d=BASE64_DATA
```

## Share Button

### Placement

In the Scoreboard bottom bar, when `isGameOver()` returns true:
- "New Game" button remains on the left
- "Share" button appears on the right (blue/primary color, with share icon)

### Behavior

On click:
1. Encode current `GameState` via `encodeGameState()`
2. Build the full share URL
3. Redirect browser to `https://is.gd/create.php?url=ENCODED_SHARE_URL`
   - is.gd's web UI shows the generated short URL on a rich HTML page
   - No CORS issues since it's a full page navigation
   - User can copy the short URL from the is.gd page and share it

## Shared Result Page (Read-Only)

### Entry Point

When `Flip7` component detects it's on the `#/flip7/share` route:
1. Extract `d` parameter from the URL hash
2. Decode via `decodeGameState()`
3. If decode fails, show an error message with a link back to home
4. If decode succeeds, render Scoreboard in read-only mode

### Scoreboard `readOnly` Prop

Add an optional `readOnly?: boolean` prop to `Scoreboard`:

When `readOnly` is true:
- Hide "New Round" / "New Game" button row
- Round chips are not clickable (no edit functionality)
- No ScoreInput modal
- Show a small "Shared Game Result" label at the top
- Winner banner still displays normally
- Player cards, progress bars, round scores all display normally

### Flip7 Page in Share Mode

When in share mode:
- Skip PlayerSetup, go directly to Scoreboard
- Hide the "New Game" button in the sub-header
- Show a "Play Your Own Game" link that navigates to `#/flip7`

## Files to Modify

1. **`src/types/game.ts`** — Add `encodeGameState()` and `decodeGameState()` functions
2. **`src/App.tsx`** — Add `#/flip7/share` route handling, pass share data to Flip7
3. **`src/pages/Flip7.tsx`** — Handle share mode: decode state, render read-only Scoreboard, add Share button to game-over state
4. **`src/components/Scoreboard.tsx`** — Add `readOnly` prop, conditionally hide interactive elements

## Edge Cases

- **Invalid/corrupted share data**: Show friendly error with link to home
- **Very long player names**: Could make URL too long. Player names are user-controlled so this is bounded by the setup UI (existing constraint)
- **URL length**: With 12 players and many rounds, the URL could get long. Base64 of the compact format should stay well under browser URL limits (~2000 chars for most services, ~8000 for modern browsers). A 12-player, 20-round game encodes to roughly ~500 chars before base64.
