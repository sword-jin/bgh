import { useState } from 'react'
import { PLAYER_COLORS } from '../types/game'

interface Props {
  onStart: (count: number, names: Record<number, string>) => void
}

export default function PlayerSetup({ onStart }: Props) {
  const [count, setCount] = useState<number | null>(null)
  const [names, setNames] = useState<Record<number, string>>({})

  const handleNameChange = (index: number, name: string) => {
    setNames(prev => ({ ...prev, [index]: name }))
  }

  return (
    <div className="flex-1 px-4 py-6">
      {/* Player Count Selection */}
      <h2 className="text-xl font-semibold text-center mb-1">How many players?</h2>
      <p className="text-sm text-slate-400 text-center mb-5">Choose 2–12 players</p>

      <div className="grid grid-cols-4 gap-2.5 max-w-xs mx-auto mb-8">
        {Array.from({ length: 11 }, (_, i) => i + 2).map(n => (
          <button
            key={n}
            onClick={() => setCount(n)}
            className={`h-12 rounded-xl font-semibold text-lg transition-all active:scale-95 ${
              count === n
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-surface text-slate-300 active:bg-surface-light'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Player Names */}
      {count !== null && (
        <>
          <h3 className="text-base font-medium text-slate-300 mb-3">Player Names</h3>
          <div className="space-y-2.5 max-w-sm mx-auto mb-6">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface rounded-xl px-3 py-2.5">
                <div
                  className="w-8 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: PLAYER_COLORS[i] }}
                />
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={names[i] || ''}
                  onChange={e => handleNameChange(i, e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base py-1"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => onStart(count, names)}
            className="w-full max-w-sm mx-auto block py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            Start Game
          </button>
        </>
      )}
    </div>
  )
}
