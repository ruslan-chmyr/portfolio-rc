import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applyThemeAttribute, readStoredTheme } from './initTheme'
import { themeDetail } from './themeTokens'
import { ThemeContext } from './themeContext'
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeChangeDetail,
} from './types'

function publishTheme(theme: Theme) {
  const detail: ThemeChangeDetail = themeDetail(theme)
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail }))
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())

  useLayoutEffect(() => {
    applyThemeAttribute(theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    publishTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
