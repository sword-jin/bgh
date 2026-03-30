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
    switch (route) {
      case '/flip7':
        return <Flip7Game />
      default:
        return <Home />
    }
  })()

  return (
    <>
      <Header />
      {page}
    </>
  )
}
