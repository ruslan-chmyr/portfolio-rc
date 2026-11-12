/**
 * Clears stale GSAP inline backgrounds that were captured against the previous
 * portfolio surface. Leaves intentional Skills/Projects navy bridge colors.
 */

const SCENE_BRIDGE_RGB = { r: 5, g: 7, b: 15 } as const
const SCENE_BRIDGE_TOLERANCE = 12

function parseCssRgb(value: string): { r: number; g: number; b: number } | null {
  const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const raw = hex[1]!
    if (raw.length === 3) {
      return {
        r: Number.parseInt(raw[0]! + raw[0]!, 16),
        g: Number.parseInt(raw[1]! + raw[1]!, 16),
        b: Number.parseInt(raw[2]! + raw[2]!, 16),
      }
    }
    return {
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
    }
  }

  const rgb = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (!rgb) return null
  return {
    r: Number(rgb[1]),
    g: Number(rgb[2]),
    b: Number(rgb[3]),
  }
}

/** True when an inline color is the Skills/Projects navy bridge (#05070f). */
export function isSceneBridgeBackground(cssColor: string): boolean {
  const parsed = parseCssRgb(cssColor)
  if (!parsed) return /#05070f/i.test(cssColor)
  return (
    Math.abs(parsed.r - SCENE_BRIDGE_RGB.r) <= SCENE_BRIDGE_TOLERANCE &&
    Math.abs(parsed.g - SCENE_BRIDGE_RGB.g) <= SCENE_BRIDGE_TOLERANCE &&
    Math.abs(parsed.b - SCENE_BRIDGE_RGB.b) <= SCENE_BRIDGE_TOLERANCE
  )
}

/**
 * Drop non-bridge inline background colors so CSS custom properties own the
 * surface again after a theme toggle. Bridge navy is preserved for section exits.
 */
export function syncThemeDependentSurfaces(
  root: ParentNode = document,
): void {
  const pin = root.querySelector<HTMLElement>('.about-section__pin')
  if (!pin) return

  const inline = pin.style.backgroundColor
  if (!inline) return
  if (isSceneBridgeBackground(inline)) return

  pin.style.removeProperty('background-color')
}
