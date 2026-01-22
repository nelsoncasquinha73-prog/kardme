'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark'

function applyTheme(theme: ThemeMode) {
  const html = document.documentElement
  const body = document.body

  html.setAttribute('data-theme', theme)
  html.classList.remove('light', 'dark')
  html.classList.add(theme)

  body.classList.remove('light', 'dark')
  body.classList.add(theme)
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem('kardme_theme') as ThemeMode) || 'dark'
    setTheme(saved)
    applyTheme(saved)
    setMounted(true)
  }, [])

  function setAndPersist(next: ThemeMode) {
    setTheme(next)
    localStorage.setItem('kardme_theme', next)
    applyTheme(next)
  }

  if (!mounted) return null

  return (
    <div id="theme-switcher" style={{ position: 'fixed', top: 12, left: 12, zIndex: 9999 }}>
      <button
        type="button"
        onClick={() => setAndPersist('light')}
        style={{
          display: 'block',
          marginBottom: 8,
          padding: '6px 10px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          background: theme === 'light' ? '#fff' : 'rgba(0,0,0,0.35)',
          color: theme === 'light' ? '#111' : '#fff',
          cursor: 'pointer',
        }}
      >
        Light
      </button>

      <button
        type="button"
        onClick={() => setAndPersist('dark')}
        style={{
          display: 'block',
          padding: '6px 10px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          background: theme === 'dark' ? '#fff' : 'rgba(0,0,0,0.35)',
          color: theme === 'dark' ? '#111' : '#fff',
          cursor: 'pointer',
        }}
      >
        Dark
      </button>
    </div>
  )
}
