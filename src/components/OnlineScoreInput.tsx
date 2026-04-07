import { useState } from 'react'
import type { OnlinePlayer, Score } from '../types/online'

interface Props {
  currentRound: number
  currentPlayer: OnlinePlayer
  allPlayers: OnlinePlayer[]
  roundScores: Score[]
  isHost: boolean
  onSubmitOwn: (score: number) => void
  onSubmitForOthers: (scores: { playerId: string; score: number }[]) => void
}

export default function OnlineScoreInput({
  currentRound,
  currentPlayer,
  allPlayers,
  roundScores,
  isHost,
  onSubmitOwn,
  onSubmitForOthers,
}: Props) {
  const [ownScore, setOwnScore] = useState('')
  const [otherScores, setOtherScores] = useState<Record<string, string>>({})

  const hasSubmitted = roundScores.some(s => s.player_id === currentPlayer.id)
  const submittedPlayerIds = new Set(roundScores.map(s => s.player_id))
  const waitingPlayers = allPlayers.filter(p => !submittedPlayerIds.has(p.id))
  const othersWaiting = waitingPlayers.filter(p => p.id !== currentPlayer.id)

  const handleSubmitOwn = () => {
    const val = parseInt(ownScore)
    if (isNaN(val)) return
    onSubmitOwn(val)
    setOwnScore('')
  }

  const handleSubmitForOthers = () => {
    const scores: { playerId: string; score: number }[] = []
    for (const p of othersWaiting) {
      const val = parseInt(otherScores[p.id] || '')
      if (isNaN(val)) continue
      scores.push({ playerId: p.id, score: val })
    }
    if (scores.length > 0) {
      onSubmitForOthers(scores)
      setOtherScores({})
    }
  }

  return (
    <div className="px-4 py-4">
      <div className="text-center text-sm text-fg-muted mb-4">Round {currentRound}</div>

      {/* Own score input */}
      {!hasSubmitted ? (
        <div className="bg-surface rounded-2xl p-4 mb-4">
          <div className="text-xs font-medium text-fg-dim uppercase tracking-wider mb-3">
            Your Score
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              inputMode="numeric"
              value={ownScore}
              onChange={e => setOwnScore(e.target.value)}
              placeholder="0"
              className="flex-1 px-4 py-3 rounded-xl bg-input text-fg text-center text-xl font-bold border border-border focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSubmitOwn}
              disabled={!ownScore}
              className="px-6 py-3 rounded-xl bg-green-500 text-white font-semibold active:bg-green-600 transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-4 mb-4 text-center">
          <div className="text-green-400 font-medium">Score submitted!</div>
        </div>
      )}

      {/* Waiting indicator */}
      {waitingPlayers.length > 0 && (
        <div className="text-center text-sm text-fg-dim mb-4">
          Waiting: {waitingPlayers.map(p => `${p.emoji} ${p.name}`).join(', ')}
        </div>
      )}

      {/* Host: fill for others */}
      {isHost && othersWaiting.length > 0 && (
        <div className="bg-surface rounded-2xl p-4">
          <div className="text-xs font-medium text-fg-dim uppercase tracking-wider mb-3">
            Fill for Others
          </div>
          <div className="space-y-3">
            {othersWaiting.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xl">{p.emoji}</span>
                <span className="text-fg font-medium flex-1 truncate">{p.name}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={otherScores[p.id] || ''}
                  onChange={e => setOtherScores(prev => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder="0"
                  className="w-20 px-3 py-2 rounded-lg bg-input text-fg text-center font-bold border border-border focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmitForOthers}
            className="w-full mt-4 py-3 rounded-xl bg-amber-500 text-white font-semibold active:bg-amber-600 transition-colors"
          >
            Submit for Others
          </button>
        </div>
      )}
    </div>
  )
}
