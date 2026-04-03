# Share Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a share feature that encodes finished game state into a URL, redirects to is.gd for short URL generation, and renders a read-only result page from shared URLs.

**Architecture:** Add encode/decode functions to `types/game.ts`, a new `#/flip7/share?d=...` route in `App.tsx`, share mode handling in `Flip7.tsx`, and a `readOnly` prop on `Scoreboard.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite 8

---

### Task 1: Add encodeGameState and decodeGameState to types/game.ts

**Files:**
- Modify: `src/types/game.ts`

- [ ] **Step 1: Add encodeGameState function**

Add after the existing `getRankings` function at the end of `src/types/game.ts`:

```typescript
export function encodeGameState(state: GameState): string {
  const names = state.players.map(p => p.name).join(',')
  const colors = state.players.map(p => PLAYER_COLORS.indexOf(p.color)).join(',')
  const rounds = state.rounds.map(r => r.join(',')).join(';')
  const raw = `${names}|${colors}|${rounds}`
  return btoa(raw)
}
```

- [ ] **Step 2: Add decodeGameState function**

Add immediately after `encodeGameState`:

```typescript
export function decodeGameState(encoded: string): GameState | null {
  try {
    const raw = atob(encoded)
    const [namesStr, colorsStr, roundsStr] = raw.split('|')
    if (!namesStr || !colorsStr) return null

    const names = namesStr.split(',')
    const colorIndices = colorsStr.split(',').map(Number)

    const players: Player[] = names.map((name, i) => ({
      id: i,
      name,
      color: PLAYER_COLORS[colorIndices[i]] || PLAYER_COLORS[0],
    }))

    const rounds: number[][] = roundsStr
      ? roundsStr.split(';').map(r => r.split(',').map(Number))
      : []

    return { players, rounds }
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Verify in browser console**

Run `npm run dev`, open browser console, and test:
```js
// Import is not needed in console — just verify the app builds without errors
```

Run: `cd /Users/sword/Code/src/github.com/sword-jin/bgh && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add encodeGameState and decodeGameState for share URLs"
```

---

### Task 2: Add share route to App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update route parsing to handle share route**

In `src/App.tsx`, replace the `page` const (lines 19-26):

```typescript
  const page = (() => {
    if (route === '/flip7') {
      return <Flip7Game />
    }
    if (route.startsWith('/flip7/share')) {
      const params = new URLSearchParams(route.split('?')[1] || '')
      const shareData = params.get('d')
      return <Flip7Game shareData={shareData} />
    }
    return <Home />
  })()
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sword/Code/src/github.com/sword-jin/bgh && npx tsc --noEmit`
Expected: Type error about `shareData` prop — this is expected, will be fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add share route to App router"
```

---

### Task 3: Add share mode to Flip7.tsx

**Files:**
- Modify: `src/pages/Flip7.tsx`

- [ ] **Step 1: Add shareData prop and share mode initialization**

Update the component to accept `shareData` and handle share mode. Replace the full component:

At the top of `src/pages/Flip7.tsx`, update imports:

```typescript
import { useState, useCallback } from 'react'
import type { GameState } from '../types/game'
import { createPlayers, getTotalScore, getRankings, encodeGameState, decodeGameState } from '../types/game'
import PlayerSetup from '../components/PlayerSetup'
import Scoreboard from '../components/Scoreboard'
import ScoreInput from '../components/ScoreInput'
```

Replace the component signature and add share mode detection at the top of the function body (line 10-16):

```typescript
export default function Flip7Game({ shareData }: { shareData?: string | null }) {
  // Share mode: decode state from URL, render read-only
  if (shareData) {
    const decoded = decodeGameState(shareData)
    if (!decoded) {
      return (
        <div className="min-h-dvh bg-page flex flex-col items-center justify-center px-6">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-lg font-semibold text-fg mb-2">Invalid Share Link</h2>
          <p className="text-sm text-fg-muted mb-6 text-center">This shared game link appears to be broken or expired.</p>
          <a href="#/" className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium active:bg-blue-600 transition-colors">
            Go Home
          </a>
        </div>
      )
    }
    const rankings = getRankings(decoded)
    const topScore = decoded.players.length > 0 ? getTotalScore(decoded, rankings[0]) : 0
    return (
      <div className="min-h-dvh bg-page flex flex-col">
        <header className="flex items-center gap-3 px-4 py-3 bg-header backdrop-blur-sm sticky top-0 z-30 border-b border-border">
          <a href="#/flip7" className="text-fg-muted p-1 -ml-1 active:text-fg transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-lg font-semibold text-fg">Flip 7</h1>
          <a href="#/flip7" className="ml-auto text-sm text-blue-400 px-3 py-1.5">
            Play Your Own
          </a>
        </header>
        <Scoreboard
          gameState={decoded}
          rankings={rankings}
          topScore={topScore}
          onNewRound={() => {}}
          onEditRound={() => {}}
          onNewGame={() => {}}
          readOnly
        />
      </div>
    )
  }

  // Normal game mode (existing code continues unchanged below)
```

The rest of the existing component code remains unchanged.

- [ ] **Step 2: Add Share button to bottom bar in Scoreboard**

This will be handled in Task 4. For now, the share mode rendering is complete.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/sword/Code/src/github.com/sword-jin/bgh && npx tsc --noEmit`
Expected: Type error about `readOnly` prop on Scoreboard — will be fixed in Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Flip7.tsx
git commit -m "feat: add share mode with read-only view and error handling to Flip7"
```

---

### Task 4: Add readOnly prop and Share button to Scoreboard.tsx

**Files:**
- Modify: `src/components/Scoreboard.tsx`

- [ ] **Step 1: Update Props interface to include readOnly and onShare**

Replace the Props interface (lines 5-12):

```typescript
interface Props {
  gameState: GameState
  rankings: number[]
  topScore: number
  onNewRound: () => void
  onEditRound: (roundIndex: number) => void
  onNewGame: () => void
  readOnly?: boolean
}
```

- [ ] **Step 2: Update component signature and add share handler**

Update the function signature (line 14):

```typescript
export default function Scoreboard({ gameState, rankings, topScore, onNewRound, onEditRound, onNewGame, readOnly }: Props) {
```

Add the `handleShare` function right after the `const winner = ...` line (after line 18):

```typescript
  const handleShare = () => {
    const encoded = encodeGameState(gameState)
    const shareUrl = `${window.location.origin}${window.location.pathname}#/flip7/share?d=${encoded}`
    window.location.href = `https://is.gd/create.php?url=${encodeURIComponent(shareUrl)}`
  }
```

Add the import for `encodeGameState` at the top of the file — update line 3:

```typescript
import { getTotalScore, isGameOver, WIN_THRESHOLD, encodeGameState } from '../types/game'
```

- [ ] **Step 3: Add "Shared Game Result" label above winner banner**

Add right after the opening `<div className="flex-1 flex flex-col">` (line 54), before the winner banner:

```tsx
      {readOnly && (
        <div className="text-center text-xs text-fg-dim uppercase tracking-wider pt-4 px-4">
          Shared Game Result
        </div>
      )}
```

- [ ] **Step 4: Make round chips non-clickable in readOnly mode**

Replace the round button element (lines 129-135) with:

```tsx
              {readOnly ? (
                <span
                  key={ri}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-chip text-sm text-fg-muted"
                >
                  R{ri + 1}
                </span>
              ) : (
                <button
                  key={ri}
                  onClick={() => onEditRound(ri)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-chip text-sm text-fg-muted active:bg-btn-active transition-colors"
                >
                  R{ri + 1}
                </button>
              )}
```

- [ ] **Step 5: Update bottom bar for readOnly and share button**

Replace the entire bottom bar section (lines 141-168) with:

```tsx
      {!readOnly && (
        <div className="sticky bottom-0 px-4 py-4 bg-bar backdrop-blur-sm border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-fg-muted">
              {rounds.length} round{rounds.length !== 1 ? 's' : ''} played
            </span>
            {topScore > 0 && (
              <span className="text-sm text-fg-dim ml-auto">
                {gameOver ? 'Game Over' : `Top: ${topScore} pts`}
              </span>
            )}
          </div>
          {gameOver ? (
            <div className="flex gap-3">
              <button
                onClick={onNewGame}
                className="flex-1 py-4 rounded-2xl bg-amber-500 text-white font-semibold text-lg active:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
              >
                New Game
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
              >
                Share
              </button>
            </div>
          ) : (
            <button
              onClick={onNewRound}
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
            >
              New Round
            </button>
          )}
        </div>
      )}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd /Users/sword/Code/src/github.com/sword-jin/bgh && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Scoreboard.tsx
git commit -m "feat: add readOnly prop and Share button to Scoreboard"
```

---

### Task 5: Manual end-to-end verification

- [ ] **Step 1: Test normal game flow**

1. Run `npm run dev`
2. Start a new Flip 7 game with 3 players
3. Play rounds until one player reaches 200+
4. Verify winner banner shows
5. Verify "New Game" and "Share" buttons appear side by side

- [ ] **Step 2: Test share flow**

1. Click "Share" button
2. Verify browser redirects to is.gd with the correct URL
3. Copy the generated short URL from is.gd
4. Open the short URL in a new tab
5. Verify the read-only scoreboard renders correctly

- [ ] **Step 3: Test shared page directly**

1. Manually navigate to `#/flip7/share?d=SOME_VALID_BASE64`
2. Verify read-only view: no "New Round" button, non-clickable round chips, "Shared Game Result" label
3. Verify "Play Your Own" link navigates to `#/flip7`

- [ ] **Step 4: Test invalid share data**

1. Navigate to `#/flip7/share?d=invaliddata!!!`
2. Verify error page shows with "Go Home" link

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
