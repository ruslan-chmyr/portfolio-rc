/** Compact macropad grid (5 × 4 = 20 cells). */
export const MACROPAD_COLS = 5
export const MACROPAD_ROWS = 4
export const MACROPAD_CELLS = MACROPAD_COLS * MACROPAD_ROWS

/** Horizontal key unit. Physical spacing is derived from this. */
export const KEY_UNIT = 1.2
export const KEY_GAP = 0.16
export const KEY_DEPTH = 1.2
export const KEYCAP_HEIGHT = 0.52
export const KEYCAP_TRAVEL = 0.1

/** Chassis padding beyond the key grid (shared with KeyboardBody). */
export const CHASSIS_PAD_X = 0.42
export const CHASSIS_PAD_Z = 0.42
export const CASE_HEIGHT = 0.72
/** Y of the keycap group above the plate. */
export const KEYCAP_STACK_Y = 0.28
/** Approx underside / top extents for framing + flip clearance. */
export const ASSEMBLY_MIN_Y = -(CASE_HEIGHT + 0.08)
export const ASSEMBLY_MAX_Y = KEYCAP_STACK_Y + KEYCAP_HEIGHT / 2 + 0.06

export type KeySpan = 1 | 2

/** Minimal skill fields required for physical placement (avoids config cycles). */
export type SkillLayoutInput = {
  id: string
  shortLabel: string
  keySpan?: KeySpan
}

/**
 * Fixed reference grid for chassis sizing — always 20 unit cells.
 * Skill placements are derived separately and may use wide keys.
 */
export type KeyboardKeyDefinition = {
  id: string
  x: number
  row: number
  col: number
  width: number
  label: string
}

function buildReferenceGrid(): KeyboardKeyDefinition[] {
  const keys: KeyboardKeyDefinition[] = []
  const pitch = KEY_UNIT + KEY_GAP

  for (let row = 0; row < MACROPAD_ROWS; row += 1) {
    for (let col = 0; col < MACROPAD_COLS; col += 1) {
      keys.push({
        id: `m${row}${col}`,
        x: col * pitch,
        row,
        col,
        width: 1,
        label: '·',
      })
    }
  }

  return keys
}

export const KEYBOARD_LAYOUT: KeyboardKeyDefinition[] = buildReferenceGrid()

export type ResolvedKeyboardKey = KeyboardKeyDefinition & {
  worldX: number
  worldZ: number
  worldWidth: number
  worldDepth: number
}

/** A skill placed onto the macropad — one interactive keycap (possibly wide). */
export type PlacedSkillKey = ResolvedKeyboardKey & {
  skillId: string
  span: KeySpan
}

export function resolveKeyGeometry(
  row: number,
  col: number,
  width: number,
): Pick<ResolvedKeyboardKey, 'worldX' | 'worldZ' | 'worldWidth' | 'worldDepth' | 'x'> {
  const pitch = KEY_UNIT + KEY_GAP
  const rowPitch = KEY_DEPTH + KEY_GAP
  const worldWidth = width * KEY_UNIT + (width - 1) * KEY_GAP
  const x = col * pitch
  return {
    x,
    worldWidth,
    worldDepth: KEY_DEPTH,
    // Center of the (possibly wide) keycap.
    worldX: x + (worldWidth - KEY_UNIT) / 2,
    worldZ: row * rowPitch,
  }
}

export function resolveKeyboardLayout(
  layout: KeyboardKeyDefinition[] = KEYBOARD_LAYOUT,
): ResolvedKeyboardKey[] {
  return layout.map((key) => ({
    ...key,
    ...resolveKeyGeometry(key.row, key.col, key.width),
  }))
}

/**
 * Deterministic row-aware placement from catalog order.
 * `keySpan: 2` occupies two adjacent cells in the same row (no wrapping mid-key).
 */
export function placeSkillsOnMacropad(
  boardSkills: readonly SkillLayoutInput[],
): PlacedSkillKey[] {
  const placed: PlacedSkillKey[] = []
  let row = 0
  let col = 0

  for (const skill of boardSkills) {
    const span = (skill.keySpan ?? 1) as KeySpan
    if (span !== 1 && span !== 2) {
      throw new Error(`Invalid keySpan for skill "${skill.id}": ${String(span)}`)
    }

    if (col + span > MACROPAD_COLS) {
      row += 1
      col = 0
    }

    if (row >= MACROPAD_ROWS) {
      throw new Error(
        `Macropad overflow placing "${skill.id}" — exceeds ${MACROPAD_ROWS}×${MACROPAD_COLS} grid`,
      )
    }

    const geometry = resolveKeyGeometry(row, col, span)
    placed.push({
      id: `k-${skill.id}`,
      skillId: skill.id,
      span,
      row,
      col,
      width: span,
      label: skill.shortLabel,
      ...geometry,
    })

    col += span
    if (col >= MACROPAD_COLS) {
      row += 1
      col = 0
    }
  }

  return placed
}

export function countOccupiedCells(placed: readonly PlacedSkillKey[]): number {
  return placed.reduce((sum, key) => sum + key.span, 0)
}

/** Key-grid XZ bounds for the full 5×4 reference (stable across categories). */
export function getMacropadChassisBounds() {
  return getKeyboardBounds(resolveKeyboardLayout(KEYBOARD_LAYOUT))
}

export type MacropadAssemblyBounds = ReturnType<typeof getKeyboardBounds> & {
  height: number
  minY: number
  maxY: number
  /** Sphere radius covering resting pose + vertical 360° flip about local X. */
  fitRadius: number
}

/**
 * Full assembly extents for camera framing: key grid + chassis pads + height + flip.
 */
export function getMacropadAssemblyBounds(
  flipPivotY = -0.1,
): MacropadAssemblyBounds {
  const grid = getMacropadChassisBounds()
  const width = grid.width + CHASSIS_PAD_X * 2
  const depth = grid.depth + CHASSIS_PAD_Z * 2
  const minY = ASSEMBLY_MIN_Y
  const maxY = ASSEMBLY_MAX_Y
  const height = maxY - minY
  const halfW = width / 2
  const halfD = depth / 2
  const extentAbove = Math.abs(maxY - flipPivotY)
  const extentBelow = Math.abs(minY - flipPivotY)
  // Vertical flip about X: radial envelope in the YZ plane, plus X half-width.
  const flipRadiusYZ = Math.hypot(halfD, Math.max(extentAbove, extentBelow))
  const fitRadius = Math.hypot(halfW, flipRadiusYZ)

  return {
    minX: grid.centerX - halfW,
    maxX: grid.centerX + halfW,
    minZ: grid.centerZ - halfD,
    maxZ: grid.centerZ + halfD,
    width,
    depth,
    centerX: grid.centerX,
    centerZ: grid.centerZ,
    height,
    minY,
    maxY,
    fitRadius,
  }
}

export function getKeyboardBounds(keys: ResolvedKeyboardKey[]) {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity

  for (const key of keys) {
    const halfW = key.worldWidth / 2
    const halfD = key.worldDepth / 2
    minX = Math.min(minX, key.worldX - halfW)
    maxX = Math.max(maxX, key.worldX + halfW)
    minZ = Math.min(minZ, key.worldZ - halfD)
    maxZ = Math.max(maxZ, key.worldZ + halfD)
  }

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
  }
}
