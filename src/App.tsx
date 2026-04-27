import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Flip7Game from './pages/Flip7'
import OnlineCreate from './pages/OnlineCreate'
import OnlineJoin from './pages/OnlineJoin'
import OnlineRoom from './pages/OnlineRoom'
import Header from './components/Header'

function Flip7ModeSelect() {
  return (
    <div className="min-h-dvh bg-page flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-header backdrop-blur-sm sticky top-0 z-30 border-b border-border">
        <a href="#/" className="text-fg-muted p-1 -ml-1 active:text-fg transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-lg font-semibold text-fg">Flip 7</h1>
      </header>
      <div className="flex-1 px-4 py-8 max-w-sm mx-auto w-full space-y-4">
        <a
          href="#/flip7/local"
          className="block bg-surface rounded-2xl p-5 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl shrink-0">
              🎮
            </div>
            <div>
              <div className="font-semibold text-fg">Local</div>
              <div className="text-sm text-fg-muted">One device, pass & play</div>
            </div>
          </div>
        </a>
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl shrink-0">
              🌐
            </div>
            <div>
              <div className="font-semibold text-fg">Online</div>
              <div className="text-sm text-fg-muted">Each player on their own device</div>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="#/flip7/online/create"
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold text-center active:bg-blue-600 transition-colors"
            >
              Create Room
            </a>
            <a
              href="#/flip7/online/join"
              className="flex-1 py-3 rounded-xl bg-btn text-fg font-semibold text-center active:bg-btn-active transition-colors"
            >
              Join Room
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRoute() {
  return window.location.hash.slice(1) || '/'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const onHash = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const page = (() => {
    if (route === '/flip7') {
      return <Flip7ModeSelect />
    }
    if (route === '/flip7/local') {
      return <Flip7Game />
    }
    if (route.startsWith('/flip7/share')) {
      const params = new URLSearchParams(route.split('?')[1] || '')
      const shareData = params.get('d')
      return <Flip7Game shareData={shareData} />
    }
    if (route === '/flip7/online/create') {
      return <OnlineCreate />
    }
    if (route.startsWith('/flip7/online/join')) {
      const params = new URLSearchParams(route.split('?')[1] || '')
      const initialCode = params.get('code') || undefined
      return <OnlineJoin initialCode={initialCode} />
    }
    const roomMatch = route.match(/^\/flip7\/online\/room\/(\d{4})$/)
    if (roomMatch) {
      return <OnlineRoom code={roomMatch[1]} />
    }
    return <Home />
  })()

  return (
    <>
      <Header />
      {page}
    </>
  )
}
