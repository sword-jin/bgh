import { useState, useRef, useEffect } from 'react'
import type { Player } from '../types/game'

interface Props {
  players: Player[]
  roundNumber: number
  initialScores?: number[]
  onSubmit: (scores: number[]) => void
  onClose: () => void
}

export default function ScoreInput({ players, roundNumber, initialScores, onSubmit, onClose }: Props) {
  const [scores, setScores] = useState<string[]>(
    players.map((_, i) => initialScores ? String(initialScores[i] ?? 0) : '')
  )
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  useEffect(() => {
    // Prevent body scroll when sheet is open
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleScoreChange = (index: number, value: string) => {
    // Allow negative numbers and empty string
    if (value === '' || value === '-' || /^-?\d+$/.test(value)) {
      setScores(prev => {
        const next = [...prev]
        next[index] = value
        return next
      })
    }
  }

  const handleSubmit = () => {
    onSubmit(scores.map(s => {
      const n = parseInt(s, 10)
      return isNaN(n) ? 0 : n
    }))
  }

  // Swipe down to dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-overlay backdrop-blur-sm">
      {/* Backdrop tap to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="bg-page rounded-t-3xl max-h-[85dvh] flex flex-col border-t border-border"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-handle" />
        </div>

        {/* Title */}
        <div className="px-5 pb-3">
          <h2 className="text-xl font-semibold text-fg">
            {initialScores ? `Edit Round ${roundNumber}` : `Round ${roundNumber}`}
          </h2>
          <p className="text-sm text-fg-muted mt-0.5">Enter each player's points</p>
        </div>

        {/* Player Inputs */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
          {players.map((player, i) => (
            <div key={player.id} className="flex items-center gap-3 bg-surface rounded-xl px-3 py-2.5">
              <div
                className="w-8 h-8 rounded-full shrink-0"
                style={{ backgroundColor: player.color }}
              />
              <span className="flex-1 text-fg font-medium truncate">{player.name}</span>
              <input
                type="number"
                inputMode="numeric"
                value={scores[i]}
                placeholder="0"
                onChange={e => handleScoreChange(i, e.target.value)}
                onFocus={e => e.target.select()}
                className="w-20 text-right bg-input text-fg text-lg font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 tabular-nums placeholder-fg-dim"
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="px-5 py-4 border-t border-border" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            {initialScores ? 'Update Scores' : 'Save Scores'}
          </button>
        </div>
      </div>
    </div>
  )
}
