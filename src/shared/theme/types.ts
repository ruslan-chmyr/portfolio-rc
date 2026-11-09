export type Theme = 'light' | 'dark'

export type Rgb = readonly [number, number, number]

export const THEME_STORAGE_KEY = 'portfolio-theme'

export const THEME_CHANGE_EVENT = 'portfolio-theme-change'

export type ThemeChangeDetail = {
  theme: Theme
  ink: Rgb
  fringe: Rgb
  background: Rgb
}
