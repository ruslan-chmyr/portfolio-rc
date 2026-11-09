import { THEME_TOKENS, type Theme } from '../../../shared/theme'
import type { LiquidRenderer } from '../../../shared/graphics/fluid/types'
import type { InkTransitionRenderer } from './createInkTransitionRenderer'

export function applyInkTheme(
  renderer: LiquidRenderer | null,
  inkTransition: InkTransitionRenderer | null,
  theme: Theme,
) {
  const tokens = THEME_TOKENS[theme]
  renderer?.setInkColors({
    ink: tokens.ink,
    clear: tokens.background,
  })
  inkTransition?.setInkColors({
    ink: tokens.ink,
    fringe: tokens.fringe,
  })
}
