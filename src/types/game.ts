export interface Player {
  id: number
  name: string
  color: string
}

export interface GameState {
  players: Player[]
  rounds: number[][] // rounds[roundIndex][playerIndex] = score
}

export const PLAYER_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#8b5cf6', // violet
  '#84cc16', // lime
  '#e11d48', // rose
]

export function createPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
    color: PLAYER_COLORS[i],
  }))
}

export function getTotalScore(state: GameState, playerIndex: number): number {
  return state.rounds.reduce((sum, round) => sum + (round[playerIndex] || 0), 0)
}

export const WIN_THRESHOLD = 200

export function isGameOver(state: GameState): boolean {
  return state.players.some((_, i) => getTotalScore(state, i) >= WIN_THRESHOLD)
}

export function getRankings(state: GameState): number[] {
  const totals = state.players.map((_, i) => getTotalScore(state, i))
  const indices = state.players.map((_, i) => i)
  indices.sort((a, b) => totals[b] - totals[a])
  return indices
}
