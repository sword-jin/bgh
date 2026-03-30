import { useRef, useLayoutEffect } from 'react'
import type { GameState } from '../types/game'
import { getTotalScore, isGameOver } from '../types/game'

interface Props {
  gameState: GameState
  rankings: number[]
  topScore: number
  onNewRound: () => void
  onEditRound: (roundIndex: number) => void
  onNewGame: () => void
}

function getRankLabel(rank: number): string {
  if (rank === 1) return '1st'
  if (rank === 2) return '2nd'
  if (rank === 3) return '3rd'
  return `${rank}th`
}

export default function Scoreboard({ gameState, rankings, topScore, onNewRound, onEditRound, onNewGame }: Props) {
  const { players, rounds } = gameState
  const gameOver = isGameOver(gameState)

  // Build rank map (handle ties)
  const rankMap = new Map<number, number>()
  let currentRank = 1
  rankings.forEach((playerIdx, i) => {
    if (i > 0) {
      const prevIdx = rankings[i - 1]
      if (getTotalScore(gameState, playerIdx) < getTotalScore(gameState, prevIdx)) {
        currentRank = i + 1
      }
    }
    rankMap.set(playerIdx, currentRank)
  })

  const winner = gameOver ? players[rankings[0]] : null
  const runnerUp = gameOver && rankings.length > 1 ? players[rankings[1]] : null

  // FLIP animation for reordering
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const prevPositions = useRef<Map<number, number>>(new Map())

  // Capture positions before DOM update
  const capturePositions = () => {
    cardRefs.current.forEach((el, id) => {
      prevPositions.current.set(id, el.getBoundingClientRect().top)
    })
  }

  // Store current positions before each render
  capturePositions()

  // After render, animate from old position to new
  useLayoutEffect(() => {
    cardRefs.current.forEach((el, id) => {
      const prevTop = prevPositions.current.get(id)
      if (prevTop === undefined) return
      const currentTop = el.getBoundingClientRect().top
      const delta = prevTop - currentTop
      if (delta === 0) return

      el.style.transform = `translateY(${delta}px)`
      el.style.transition = 'none'

      requestAnimationFrame(() => {
        el.style.transition = 'transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1)'
        el.style.transform = ''
      })
    })
  }, [rankings.join(',')])

  return (
    <div className="flex-1 flex flex-col">
      {/* Winner Banner */}
      {gameOver && winner && (
        <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 p-5 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xs uppercase tracking-wider text-amber-400/70 font-medium mb-1">Winner</div>
          <div className="text-2xl font-bold text-white mb-0.5">{winner.name}</div>
          <div className="text-amber-400 font-semibold text-lg">{getTotalScore(gameState, rankings[0])} pts</div>
          {runnerUp && (
            <div className="mt-3 pt-3 border-t border-amber-500/20 text-sm text-slate-400">
              Runner-up: <span className="text-white font-medium">{runnerUp.name}</span>
              <span className="text-slate-500 ml-1">({getTotalScore(gameState, rankings[1])} pts)</span>
            </div>
          )}
        </div>
      )}

      {/* Player Cards */}
      <div className="flex-1 px-4 py-4 space-y-2.5 overflow-y-auto">
        {rankings.map(playerIdx => {
          const player = players[playerIdx]
          const total = getTotalScore(gameState, playerIdx)
          const rank = rankMap.get(playerIdx)!

          return (
            <div
              key={player.id}
              ref={el => {
                if (el) cardRefs.current.set(player.id, el)
                else cardRefs.current.delete(player.id)
              }}
              className="bg-surface rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                rank === 3 ? 'bg-orange-600/20 text-orange-400' :
                'bg-slate-700 text-slate-500'
              }`}>
                {getRankLabel(rank)}
              </div>

              {/* Player Info */}
              <div
                className="w-3 h-8 rounded-full shrink-0"
                style={{ backgroundColor: player.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{player.name}</div>
                {rounds.length > 0 && (
                  <div className="flex gap-1.5 mt-1 overflow-x-auto no-scrollbar">
                    {rounds.map((round, ri) => (
                      <span
                        key={ri}
                        className="text-xs text-slate-500 bg-slate-800 rounded px-1.5 py-0.5 shrink-0"
                      >
                        {round[playerIdx] ?? 0}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="text-right shrink-0">
                <div className={`text-2xl font-bold tabular-nums ${
                  rank === 1 && total > 0 ? 'text-amber-400' : 'text-white'
                }`}>
                  {total}
                </div>
                <div className="text-xs text-slate-500">pts</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Round History */}
      {rounds.length > 0 && (
        <div className="px-4 pb-2">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Rounds</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {rounds.map((_, ri) => (
              <button
                key={ri}
                onClick={() => onEditRound(ri)}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 text-sm text-slate-400 active:bg-slate-700 transition-colors"
              >
                R{ri + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="sticky bottom-0 px-4 py-4 bg-slate-900/90 backdrop-blur-sm border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-slate-400">
            {rounds.length} round{rounds.length !== 1 ? 's' : ''} played
          </span>
          {topScore > 0 && (
            <span className="text-sm text-slate-500 ml-auto">
              {gameOver ? 'Game Over' : `Top: ${topScore} pts`}
            </span>
          )}
        </div>
        {gameOver ? (
          <button
            onClick={onNewGame}
            className="w-full py-4 rounded-2xl bg-amber-500 text-white font-semibold text-lg active:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
          >
            New Game
          </button>
        ) : (
          <button
            onClick={onNewRound}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            New Round
          </button>
        )}
      </div>
    </div>
  )
}
