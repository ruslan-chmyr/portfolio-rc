export { ThemeProvider } from './ThemeProvider'
export type { ThemeContextValue } from './themeContext'
export { useTheme } from './useTheme'
export { applyThemeAttribute, readStoredTheme } from './initTheme'
export { chromeLogoSrc, portfolioLogoSrc } from './portfolioLogoSrc'
export type { PortfolioChromeSurface } from './portfolioLogoSrc'
export {
  isSceneBridgeBackground,
  syncThemeDependentSurfaces,
} from './syncThemeDependentSurfaces'
export { THEME_TOKENS, themeDetail } from './themeTokens'
export {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeChangeDetail,
  type Rgb,
} from './types'
