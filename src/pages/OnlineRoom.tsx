import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Room, OnlinePlayer, Score } from '../types/online'
import { getRoomSession } from '../types/online'
import type { GameState, Player } from '../types/game'
import { PLAYER_COLORS, getTotalScore, getRankings, WIN_THRESHOLD } from '../types/game'
import Lobby from '../components/Lobby'
import Scoreboard from '../components/Scoreboard'
import OnlineScoreInput from '../components/OnlineScoreInput'

export default function OnlineRoom({ code }: { code: string }) {
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<OnlinePlayer[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    const session = getRoomSession(code)
    if (session) setCurrentPlayerId(session.playerId)

    const load = async () => {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle()
      if (!roomData) {
        setError('Room not found')
        setLoading(false)
        return
      }
      setRoom(roomData as Room)

      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('created_at')
      setPlayers((playerData || []) as OnlinePlayer[])

      const { data: scoreData } = await supabase
        .from('scores')
        .select('*')
        .eq('room_id', roomData.id)
        .order('round_number')
      setScores((scoreData || []) as Score[])

      setLoading(false)
    }
    load()
  }, [code])

  // Realtime subscriptions — refetch on change for reliability
  // (Supabase Realtime filters on non-PK UUID columns can be unreliable)
  useEffect(() => {
    if (!room) return

    const refetchPlayers = () => {
      supabase.from('players').select('*').eq('room_id', room.id).order('created_at')
        .then(({ data }) => setPlayers((data || []) as OnlinePlayer[]))
    }
    const refetchScores = () => {
      supabase.from('scores').select('*').eq('room_id', room.id).order('round_number')
        .then(({ data }) => setScores((data || []) as Score[]))
    }

    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => { if (payload.new) setRoom(payload.new as Room) }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players' },
        (payload) => {
          const p = payload.new as OnlinePlayer
          if (p.room_id === room.id) refetchPlayers()
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scores' },
        (payload) => {
          const s = payload.new as Score
          if (s.room_id === room.id) refetchScores()
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'scores' },
        () => refetchScores()
      )
      .subscribe((status) => {
        // Refetch after subscription is ready to catch changes
        // that happened between initial load and subscription setup
        if (status === 'SUBSCRIBED') {
          supabase.from('rooms').select('*').eq('id', room.id).maybeSingle()
            .then(({ data }) => { if (data) setRoom(data as Room) })
          refetchPlayers()
          refetchScores()
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [room?.id])

  // Auto-start game when all players joined
  useEffect(() => {
    if (!room || room.status !== 'waiting') return
    if (players.length < room.player_count) return

    const currentPlayer = players.find(p => p.id === currentPlayerId)
    if (!currentPlayer?.is_host) return

    // Host triggers game start
    supabase.from('rooms').update({ status: 'playing', current_round: 1 }).eq('id', room.id).then()
  }, [room, players, currentPlayerId])

  // Auto-advance round when all scores submitted
  useEffect(() => {
    if (!room || room.status !== 'playing' || room.current_round === 0) return

    const currentRoundScores = scores.filter(s => s.round_number === room.current_round)
    if (currentRoundScores.length < players.length) return

    const currentPlayer = players.find(p => p.id === currentPlayerId)
    if (!currentPlayer?.is_host) return

    // Check if game over
    const gameState = buildGameState()
    if (!gameState) return

    const isOver = gameState.players.some((_, i) => getTotalScore(gameState, i) >= WIN_THRESHOLD)
    if (isOver) {
      supabase.from('rooms').update({ status: 'finished' }).eq('id', room.id).then()
    } else {
      supabase.from('rooms').update({ current_round: room.current_round + 1 }).eq('id', room.id).then()
    }
  }, [room, scores, players, currentPlayerId])

  const buildGameState = useCallback((): GameState | null => {
    if (players.length === 0) return null

    const gamePlayers: Player[] = players.map((p, i) => ({
      id: i,
      name: `${p.emoji} ${p.name}`,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    }))

    const maxRound = scores.reduce((max, s) => Math.max(max, s.round_number), 0)
    const rounds: number[][] = []
    for (let r = 1; r <= maxRound; r++) {
      const roundScores = scores.filter(s => s.round_number === r)
      if (roundScores.length === 0) continue
      const row = players.map(p => {
        const s = roundScores.find(sc => sc.player_id === p.id)
        return s ? s.score : 0
      })
      rounds.push(row)
    }

    return { players: gamePlayers, rounds }
  }, [players, scores])

  const handleSubmitOwn = async (score: number) => {
    if (!room || !currentPlayerId) return
    await supabase.from('scores').insert({
      room_id: room.id,
      round_number: room.current_round,
      player_id: currentPlayerId,
      score,
      submitted_by: currentPlayerId,
    })
  }

  const handleSubmitForOthers = async (otherScores: { playerId: string; score: number }[]) => {
    if (!room || !currentPlayerId) return
    const inserts = otherScores.map(s => ({
      room_id: room.id,
      round_number: room.current_round,
      player_id: s.playerId,
      score: s.score,
      submitted_by: currentPlayerId,
    }))
    await supabase.from('scores').insert(inserts)
  }

  const handleAddLocalPlayer = async (name: string, emoji: string) => {
    if (!room) return
    await supabase.from('players').insert({
      room_id: room.id,
      name,
      emoji,
      is_host: false,
      session_token: crypto.randomUUID(),
    })
  }

  const handleNewGame = async () => {
    if (!room) return
    // Delete all scores and reset room
    await supabase.from('scores').delete().eq('room_id', room.id)
    await supabase.from('rooms').update({ status: 'playing', current_round: 1 }).eq('id', room.id)
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-page flex items-center justify-center">
        <div className="text-fg-muted">Loading...</div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-dvh bg-page flex flex-col items-center justify-center px-6">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-lg font-semibold text-fg mb-2">{error || 'Room not found'}</h2>
        <a href="#/" className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium active:bg-blue-600 transition-colors">
          Go Home
        </a>
      </div>
    )
  }

  const currentPlayer = players.find(p => p.id === currentPlayerId)
  const isHost = currentPlayer?.is_host ?? false
  const gameState = buildGameState()
  const rankings = gameState ? getRankings(gameState) : []
  const topScore = gameState && gameState.players.length > 0 && rankings.length > 0
    ? getTotalScore(gameState, rankings[0])
    : 0
  const currentRoundScores = scores.filter(s => s.round_number === room.current_round)

  return (
    <div className="min-h-dvh bg-page flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-header backdrop-blur-sm sticky top-0 z-30 border-b border-border">
        <a href="#/" className="text-fg-muted p-1 -ml-1 active:text-fg transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-lg font-semibold text-fg">Flip 7</h1>
        <span className="ml-auto text-sm text-fg-dim font-mono">#{room.code}</span>
      </header>

      {room.status === 'waiting' && currentPlayerId && (
        <Lobby room={room} players={players} currentPlayerId={currentPlayerId} onAddLocalPlayer={handleAddLocalPlayer} />
      )}

      {(room.status === 'playing' || room.status === 'finished') && gameState && (
        <>
          <Scoreboard
            gameState={gameState}
            rankings={rankings}
            topScore={topScore}
            onNewGame={isHost ? handleNewGame : undefined}
          />

          {room.status === 'playing' && currentPlayer && room.current_round > 0 && (
            <OnlineScoreInput
              currentRound={room.current_round}
              currentPlayer={currentPlayer}
              allPlayers={players}
              roundScores={currentRoundScores}
              isHost={isHost}
              onSubmitOwn={handleSubmitOwn}
              onSubmitForOthers={handleSubmitForOthers}
            />
          )}
        </>
      )}
    </div>
  )
}
