import { useState, useCallback } from 'react'
import type { GameState } from '../types/game'
import { createPlayers, getTotalScore, getRankings } from '../types/game'
import PlayerSetup from '../components/PlayerSetup'
import Scoreboard from '../components/Scoreboard'
import ScoreInput from '../components/ScoreInput'

type Screen = 'setup' | 'game'

export default function Flip7Game() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [gameState, setGameState] = useState<GameState>({ players: [], rounds: [] })
  const [showScoreInput, setShowScoreInput] = useState(false)
  const [editingRound, setEditingRound] = useState<number | null>(null)
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const handleStartGame = useCallback((playerCount: number, names: Record<number, string>) => {
    const players = createPlayers(playerCount)
    players.forEach(p => {
      if (names[p.id]) p.name = names[p.id]
    })
    setGameState({ players, rounds: [] })
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
    setShowScoreInput(false)
    setEditingRound(null)
  }, [editingRound])

  const handleNewRound = useCallback(() => {
    setEditingRound(null)
    setShowScoreInput(true)
  }, [])

  const handleEditRound = useCallback((roundIndex: number) => {
    setEditingRound(roundIndex)
    setShowScoreInput(true)
  }, [])

  const handleNewGame = useCallback(() => {
    setShowConfirmReset(true)
  }, [])

  const confirmNewGame = useCallback(() => {
    setScreen('setup')
    setGameState({ players: [], rounds: [] })
    setShowScoreInput(false)
    setEditingRound(null)
    setShowConfirmReset(false)
  }, [])

  const rankings = getRankings(gameState)
  const topScore = gameState.players.length > 0 ? getTotalScore(gameState, rankings[0]) : 0

  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-surface-dark/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-800">
        <a href="#/" className="text-slate-400 p-1 -ml-1 active:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-lg font-semibold">Flip 7</h1>
        {screen === 'game' && (
          <button
            onClick={handleNewGame}
            className="ml-auto text-sm text-slate-400 active:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition-colors"
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
          initialScores={editingRound !== null ? gameState.rounds[editingRound] : undefined}
          onSubmit={handleSubmitScores}
          onClose={() => { setShowScoreInput(false); setEditingRound(null) }}
        />
      )}

      {/* Confirm New Game Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-xs text-center">
            <h3 className="text-lg font-semibold text-white mb-2">New Game?</h3>
            <p className="text-sm text-slate-400 mb-6">Current game progress will be lost.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-medium active:bg-slate-600 transition-colors"
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
