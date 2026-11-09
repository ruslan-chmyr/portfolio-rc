import { THEME_STORAGE_KEY, type Theme } from './types'

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyThemeAttribute(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}
