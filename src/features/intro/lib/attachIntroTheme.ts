import { readStoredTheme, THEME_CHANGE_EVENT, type ThemeChangeDetail } from '../../../shared/theme'
import { applyInkTheme } from './applyInkTheme'
import type { IntroRuntime } from './introRuntime'

/** Imperative theme binding for WebGL renderers — no React state. */
export function attachIntroTheme(runtime: IntroRuntime): () => void {
  applyInkTheme(runtime.renderer, runtime.inkTransition, readStoredTheme())

  const onThemeChange = (event: Event) => {
    const detail = (event as CustomEvent<ThemeChangeDetail>).detail
    applyInkTheme(runtime.renderer, runtime.inkTransition, detail.theme)
  }

  window.addEventListener(THEME_CHANGE_EVENT, onThemeChange)
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange)
}
