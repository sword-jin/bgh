import { useState, useCallback } from 'react'
import type { GameState } from '../types/game'
import { createPlayers, getTotalScore, getRankings, decodeGameState } from '../types/game'
import PlayerSetup from '../components/PlayerSetup'
import Scoreboard from '../components/Scoreboard'
import ScoreInput from '../components/ScoreInput'

type Screen = 'setup' | 'game'

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
        />
      </div>
    )
  }

  const [screen, setScreen] = useState<Screen>('setup')
  const [gameState, setGameState] = useState<GameState>({ players: [], rounds: [] })
  const [showScoreInput, setShowScoreInput] = useState(false)
  const [editingRound, setEditingRound] = useState<number | null>(null)
  const [draftScores, setDraftScores] = useState<string[]>([])
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const handleStartGame = useCallback((playerCount: number, names: Record<number, string>) => {
    const players = createPlayers(playerCount)
    players.forEach(p => {
      if (names[p.id]) p.name = names[p.id]
    })
    setGameState({ players, rounds: [] })
    setDraftScores(players.map(() => ''))
    setScreen('game')
    setShowScoreInput(true)
  }, [])

  const handleSubmitScores = useCallback((scores: number[]) => {
    setGameState(prev => {
      const newRounds = [...prev.rounds]
      if (editingRound !== null) {
        newRounds[editingRound] = scores
      } else {
        newRounds.push(scores)
      }
      return { ...prev, rounds: newRounds }
    })
    setDraftScores(gameState.players.map(() => ''))
    setShowScoreInput(false)
    setEditingRound(null)
  }, [editingRound, gameState.players])

  const handleNewRound = useCallback(() => {
    setEditingRound(null)
    setShowScoreInput(true)
  }, [])

  const handleEditRound = useCallback((roundIndex: number) => {
    setEditingRound(roundIndex)
    setDraftScores(gameState.rounds[roundIndex].map(String))
    setShowScoreInput(true)
  }, [gameState.rounds])

  const handleNewGame = useCallback(() => {
    setShowConfirmReset(true)
  }, [])

  const confirmNewGame = useCallback(() => {
    setGameState(prev => ({ ...prev, rounds: [] }))
    setShowScoreInput(true)
    setEditingRound(null)
    setShowConfirmReset(false)
  }, [])

  const rankings = getRankings(gameState)
  const topScore = gameState.players.length > 0 ? getTotalScore(gameState, rankings[0]) : 0

  return (
    <div className="min-h-dvh bg-page flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-header backdrop-blur-sm sticky top-0 z-30 border-b border-border">
        <a href="#/" className="text-fg-muted p-1 -ml-1 active:text-fg transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-lg font-semibold text-fg">Flip 7</h1>
        {screen === 'game' && (
          <button
            onClick={handleNewGame}
            className="ml-auto text-sm text-fg-muted active:text-fg px-3 py-1.5 rounded-lg bg-btn transition-colors"
          >
            New Game
          </button>
        )}
      </header>

      {/* Content */}
      {screen === 'setup' ? (
        <PlayerSetup onStart={handleStartGame} />
      ) : (
        <Scoreboard
          gameState={gameState}
          rankings={rankings}
          topScore={topScore}
          onNewRound={handleNewRound}
          onEditRound={handleEditRound}
          onNewGame={handleNewGame}
        />
      )}

      {/* Score Input Sheet */}
      {showScoreInput && (
        <ScoreInput
          players={gameState.players}
          roundNumber={editingRound !== null ? editingRound + 1 : gameState.rounds.length + 1}
          scores={draftScores}
          onScoresChange={setDraftScores}
          isEditing={editingRound !== null}
          onSubmit={handleSubmitScores}
          onClose={() => { setShowScoreInput(false); setEditingRound(null) }}
        />
      )}

      {/* Confirm New Game Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm px-6">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-xs text-center">
            <h3 className="text-lg font-semibold text-fg mb-2">New Game?</h3>
            <p className="text-sm text-fg-muted mb-6">Current game progress will be lost.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-3 rounded-xl bg-btn text-fg font-medium active:bg-btn-active transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewGame}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium active:bg-red-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
