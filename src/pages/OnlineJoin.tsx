import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRandomEmoji, saveRoomSession } from '../types/online'
import type { OnlinePlayer } from '../types/online'

export default function OnlineJoin({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode || '')
  const [name, setName] = useState('')
  const [emoji] = useState(() => getRandomEmoji())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    if (!code.trim() || code.length !== 4) {
      setError('Please enter a 4-digit room code')
      return
    }
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Find room
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.trim())
        .in('status', ['waiting', 'playing'])
        .maybeSingle()
      if (roomErr) throw roomErr
      if (!room) {
        setError('Room not found or already finished')
        setLoading(false)
        return
      }

      // Check if room is full
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
      if (count !== null && count >= room.player_count) {
        setError('Room is full')
        setLoading(false)
        return
      }

      // Get used emojis to avoid duplicates
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('emoji')
        .eq('room_id', room.id)
      const usedEmojis = (existingPlayers || []).map((p: Pick<OnlinePlayer, 'emoji'>) => p.emoji)
      const finalEmoji = usedEmojis.includes(emoji) ? getRandomEmoji(usedEmojis) : emoji

      // Create player
      const sessionToken = crypto.randomUUID()
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: name.trim(),
          emoji: finalEmoji,
          is_host: false,
          session_token: sessionToken,
        })
        .select()
        .single()
      if (playerErr || !player) throw playerErr || new Error('Failed to join room')

      saveRoomSession(code.trim(), player.id, sessionToken)
      window.location.hash = `/flip7/online/room/${code.trim()}`
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-page flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-header backdrop-blur-sm sticky top-0 z-30 border-b border-border">
        <a href="#/" className="text-fg-muted p-1 -ml-1 active:text-fg transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-lg font-semibold text-fg">Join Room</h1>
      </header>

      <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full">
        {/* Emoji Avatar */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">{emoji}</div>
          <div className="text-sm text-fg-muted">Your avatar</div>
        </div>

        {/* Room Code */}
        <div className="mb-4">
          <label className="text-xs font-medium text-fg-dim uppercase tracking-wider mb-2 block">
            Room Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit code"
            maxLength={4}
            className="w-full px-4 py-3 rounded-xl bg-input text-fg border border-border focus:outline-none focus:border-blue-500 transition-colors text-center text-2xl font-bold tracking-[0.3em]"
          />
        </div>

        {/* Name Input */}
        <div className="mb-8">
          <label className="text-xs font-medium text-fg-dim uppercase tracking-wider mb-2 block">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-input text-fg border border-border focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center mb-4">{error}</div>
        )}

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    </div>
  )
}
