import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRandomEmoji, saveRoomSession } from '../types/online'

export default function OnlineCreate() {
  const [name, setName] = useState('')
  const [playerCount, setPlayerCount] = useState(3)
  const [emoji] = useState(() => getRandomEmoji())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Generate unique 4-digit code
      let code = ''
      for (let i = 0; i < 10; i++) {
        code = String(Math.floor(1000 + Math.random() * 9000))
        const { data: existing } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', code)
          .eq('status', 'waiting')
          .maybeSingle()
        if (!existing) break
      }

      // Create room
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .insert({ code, player_count: playerCount, status: 'waiting', current_round: 0 })
        .select()
        .single()
      if (roomErr || !room) throw roomErr || new Error('Failed to create room')

      // Create host player
      const sessionToken = crypto.randomUUID()
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: name.trim(),
          emoji,
          is_host: true,
          session_token: sessionToken,
        })
        .select()
        .single()
      if (playerErr || !player) throw playerErr || new Error('Failed to create player')

      saveRoomSession(code, player.id, sessionToken)
      window.location.hash = `/flip7/online/room/${code}`
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
        <h1 className="text-lg font-semibold text-fg">Create Room</h1>
      </header>

      <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full">
        {/* Emoji Avatar */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">{emoji}</div>
          <div className="text-sm text-fg-muted">Your avatar</div>
        </div>

        {/* Name Input */}
        <div className="mb-6">
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

        {/* Player Count */}
        <div className="mb-8">
          <label className="text-xs font-medium text-fg-dim uppercase tracking-wider mb-2 block">
            Number of Players
          </label>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => i + 2).map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                  n === playerCount
                    ? 'bg-blue-500 text-white'
                    : 'bg-btn text-fg-muted active:bg-btn-active'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center mb-4">{error}</div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </div>
  )
}
