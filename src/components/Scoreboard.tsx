import { useRef, useLayoutEffect } from 'react'
import type { GameState } from '../types/game'
import { getTotalScore, isGameOver, WIN_THRESHOLD, encodeGameState } from '../types/game'

interface Props {
  gameState: GameState
  rankings: number[]
  topScore: number
  onNewRound?: () => void
  onEditRound?: (roundIndex: number) => void
  onNewGame?: () => void
}

export default function Scoreboard({ gameState, rankings, topScore, onNewRound, onEditRound, onNewGame }: Props) {
  const { players, rounds } = gameState
  const gameOver = isGameOver(gameState)

  const winner = gameOver ? players[rankings[0]] : null

  const handleShare = () => {
    const encoded = encodeGameState(gameState)
    const shareUrl = `${window.location.origin}${window.location.pathname}#/flip7/share?d=${encoded}`
    window.location.href = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(shareUrl)}`
  }

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
          <div className="text-2xl font-bold text-fg mb-0.5">{winner.name}</div>
          <div className="text-amber-400 font-semibold text-lg">{getTotalScore(gameState, rankings[0])} pts</div>
        </div>
      )}

      {/* Player Cards */}
      <div className="flex-1 px-4 py-4 space-y-2.5 overflow-y-auto">
        {rankings.map(playerIdx => {
          const player = players[playerIdx]
          const total = getTotalScore(gameState, playerIdx)
          const progress = Math.min(total / WIN_THRESHOLD, 1)

          return (
            <div
              key={player.id}
              ref={el => {
                if (el) cardRefs.current.set(player.id, el)
                else cardRefs.current.delete(player.id)
              }}
              className="bg-surface rounded-2xl overflow-hidden"
            >
              <div className="px-4 py-3 flex items-center gap-3">
                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-fg font-medium truncate">{player.name}</div>
                  {rounds.length > 0 && (
                    <div className="flex gap-1.5 mt-1 overflow-x-auto no-scrollbar">
                      {rounds.map((round, ri) => (
                        <span
                          key={ri}
                          className="text-xs text-fg-dim bg-chip rounded px-1.5 py-0.5 shrink-0"
                        >
                          {round[playerIdx] ?? 0}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold tabular-nums text-fg">
                    {total}
                  </div>
                  <div className="text-xs text-fg-dim">pts</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-chip">
                <div
                  className="h-full rounded-r-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: player.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Round History */}
      {rounds.length > 0 && (
        <div className="px-4 pb-2">
          <h3 className="text-xs font-medium text-fg-dim uppercase tracking-wider mb-2">Rounds</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {rounds.map((_, ri) => (
              onEditRound ? (
                <button
                  key={ri}
                  onClick={() => onEditRound(ri)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-chip text-sm text-fg-muted active:bg-btn-active transition-colors"
                >
                  R{ri + 1}
                </button>
              ) : (
                <span
                  key={ri}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-chip text-sm text-fg-muted"
                >
                  R{ri + 1}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="sticky bottom-0 px-4 py-4 bg-bar backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-fg-muted">
            {rounds.length} round{rounds.length !== 1 ? 's' : ''} played
          </span>
          {topScore > 0 && (
            <span className="text-sm text-fg-dim ml-auto">
              {gameOver ? 'Game Over' : `Top: ${topScore} pts`}
            </span>
          )}
        </div>
        {gameOver ? (
          <div className="flex gap-3">
            {onNewGame && (
              <button
                onClick={onNewGame}
                className="flex-1 py-4 rounded-2xl bg-amber-500 text-white font-semibold text-lg active:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
              >
                New Game
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex-1 py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
            >
              Share
            </button>
          </div>
        ) : onNewRound ? (
          <button
            onClick={onNewRound}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg active:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            New Round
          </button>
        ) : null}
      </div>
    </div>
  )
}
