export interface Room {
  id: string
  code: string
  player_count: number
  status: 'waiting' | 'playing' | 'finished'
  current_round: number
  created_at: string
}

export interface OnlinePlayer {
  id: string
  room_id: string
  name: string
  emoji: string
  is_host: boolean
  session_token: string
  created_at: string
}

export interface Score {
  id: string
  room_id: string
  round_number: number
  player_id: string
  score: number
  submitted_by: string
  created_at: string
}

export const ANIMAL_EMOJIS = [
  '🦊', '🐼', '🦁', '🐯', '🐨', '🐸', '🦄', '🐙', '🦋', '🐬',
  '🦈', '🐢', '🦉', '🐝', '🐺', '🦎', '🐧', '🐘', '🦩', '🐳',
  '🦜', '🐿️', '🦔', '🐾', '🦀', '🐌', '🦚', '🐠', '🦧', '🐫',
]

export function getRandomEmoji(usedEmojis: string[] = []): string {
  const available = ANIMAL_EMOJIS.filter(e => !usedEmojis.includes(e))
  if (available.length === 0) return ANIMAL_EMOJIS[Math.floor(Math.random() * ANIMAL_EMOJIS.length)]
  return available[Math.floor(Math.random() * available.length)]
}

export function getSessionToken(): string {
  const key = 'bgh_session_token'
  let token = localStorage.getItem(key)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(key, token)
  }
  return token
}

export function getRoomSession(code: string): { playerId: string; sessionToken: string } | null {
  const raw = localStorage.getItem(`bgh_room_${code}`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveRoomSession(code: string, playerId: string, sessionToken: string) {
  localStorage.setItem(`bgh_room_${code}`, JSON.stringify({ playerId, sessionToken }))
}
