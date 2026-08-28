import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// An installed PWA on iOS can sit suspended for days and only checks for a new
// build when it feels like it — which is how an afternoon of fixes went out
// without ever reaching the phone they were written for. So the app asks, every
// time it comes back to the foreground, and again hourly while it stays open.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    const check = () => {
      if (!document.hidden) registration.update()
    }
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    setInterval(check, 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
