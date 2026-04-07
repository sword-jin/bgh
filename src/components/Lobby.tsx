import { useState } from 'react'
import type { Room, OnlinePlayer } from '../types/online'
import { getRandomEmoji } from '../types/online'

interface Props {
  room: Room
  players: OnlinePlayer[]
  currentPlayerId: string
  onAddLocalPlayer: (name: string, emoji: string) => void
}

export default function Lobby({ room, players, currentPlayerId, onAddLocalPlayer }: Props) {
  const [localName, setLocalName] = useState('')
  const emptySlots = room.player_count - players.length
  const currentPlayer = players.find(p => p.id === currentPlayerId)
  const isHost = currentPlayer?.is_host ?? false
  const usedEmojis = players.map(p => p.emoji)

  const handleAddLocal = () => {
    if (!localName.trim()) return
    const emoji = getRandomEmoji(usedEmojis)
    onAddLocalPlayer(localName.trim(), emoji)
    setLocalName('')
  }

  return (
    <div className="flex-1 px-4 py-6">
      {/* Room Code */}
      <div className="text-center mb-8">
        <div className="text-xs text-fg-dim uppercase tracking-widest mb-1">Room Code</div>
        <div className="text-4xl font-extrabold tracking-[0.3em] text-blue-400">{room.code}</div>
        <div className="text-sm text-fg-muted mt-1">Share this code with other players</div>
      </div>

      {/* Players List */}
      <div className="bg-surface rounded-2xl p-4 mb-4">
        <div className="text-xs font-medium text-fg-dim uppercase tracking-wider mb-3">
          Players ({players.length} / {room.player_count})
        </div>
        <div className="space-y-3">
          {players.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-2xl">{p.emoji}</span>
              <span className="font-medium text-fg">
                {p.name}
                {p.id === currentPlayerId && (
                  <span className="text-fg-dim text-xs ml-1">(you)</span>
                )}
              </span>
              {p.is_host && (
                <span className="ml-auto text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-medium">
                  Host
                </span>
              )}
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 text-fg-dim">
              <span className="text-2xl">⬜</span>
              <span>Waiting...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Host: add local player */}
      {isHost && emptySlots > 0 && (
        <div className="bg-surface rounded-2xl p-4 mb-4">
          <div className="text-xs font-medium text-fg-dim uppercase tracking-wider mb-3">
            Add Player Without Device
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              placeholder="Player name"
              maxLength={20}
              className="flex-1 px-4 py-3 rounded-xl bg-input text-fg border border-border focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleAddLocal}
              disabled={!localName.trim()}
              className="px-5 py-3 rounded-xl bg-amber-500 text-white font-semibold active:bg-amber-600 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-fg-dim">
        Game starts when all players join
      </div>
    </div>
  )
}
