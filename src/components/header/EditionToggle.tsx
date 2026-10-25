'use client'

import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'c60-theme'

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
const getTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
const getServerTheme = (): Theme | null => null

/**
 * The "Morning / Night Edition" stamp doubles as the theme switch. The initial theme is
 * set before paint by the inline script in the layout, so there is no flash.
 */
export function EditionToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  const toggle = () => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode or blocked storage: the switch still works for this visit.
    }
  }

  return (
    <button
      type="button"
      className="edition-toggle"
      onClick={toggle}
      aria-label={`Switch to ${next === 'dark' ? 'Night' : 'Morning'} Edition`}
      title={`Switch to ${next === 'dark' ? 'Night' : 'Morning'} Edition`}
    >
      <span aria-hidden="true" className="edition-toggle__icon">
        {theme === 'dark' ? '☾' : '☀'}
      </span>
      {/* Before hydration the label is unknown, so keep the box stable and fill it in after. */}
      <span className="edition-toggle__label">
        {theme === null ? 'Edition' : theme === 'dark' ? 'Night Edition' : 'Morning Edition'}
      </span>
    </button>
  )
}

/** Runs in <head> before first paint: stored choice, else the device setting. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`
