import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Flip7Game from './pages/Flip7'
import Header from './components/Header'

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
      return <Flip7Game />
    }
    if (route.startsWith('/flip7/share')) {
      const params = new URLSearchParams(route.split('?')[1] || '')
      const shareData = params.get('d')
      return <Flip7Game shareData={shareData} />
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
