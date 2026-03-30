export default function Home() {
  return (
    <div className="min-h-dvh bg-page px-4 pt-12 pb-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-fg">Board Game Helper</h1>
      <p className="text-fg-muted text-center mb-8">Track scores for your favorite games</p>

      <div className="max-w-sm mx-auto space-y-4">
        <a
          href="#/flip7"
          className="block bg-surface rounded-2xl p-6 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl shrink-0">
              🃏
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-fg">Flip 7</h2>
              <p className="text-sm text-fg-muted">Card game score tracker</p>
            </div>
            <svg className="w-5 h-5 text-fg-dim ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  )
}
