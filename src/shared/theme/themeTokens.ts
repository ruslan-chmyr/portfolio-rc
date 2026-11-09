import type { Rgb, Theme } from './types'

export const THEME_TOKENS: Record<
  Theme,
  {
    ink: Rgb
    fringe: Rgb
    background: Rgb
    backgroundComplete: Rgb
  }
> = {
  light: {
    ink: [0, 0, 0],
    fringe: [0.48, 0.48, 0.51],
    background: [1, 1, 1],
    backgroundComplete: [0, 0, 0],
  },
  dark: {
    ink: [1, 1, 1],
    fringe: [0.58, 0.58, 0.6],
    background: [0, 0, 0],
    backgroundComplete: [1, 1, 1],
  },
}

export function themeDetail(theme: Theme) {
  const t = THEME_TOKENS[theme]
  return { theme, ink: t.ink, fringe: t.fringe, background: t.background }
}
