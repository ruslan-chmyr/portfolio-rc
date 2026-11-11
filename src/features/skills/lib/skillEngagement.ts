/** How the user activated Skill Inspection. */
export type SkillEngageModality = 'mouse' | 'touch' | 'keyboard'

export type SkillEngageOptions = {
  playSound?: boolean
  modality?: SkillEngageModality
}

export function pointerTypeToModality(pointerType: string): SkillEngageModality {
  return pointerType === 'touch' ? 'touch' : 'mouse'
}

/**
 * Mouse/pen leaving the keyboard restores idle inspection.
 * Touch leave after a tap must not clear — sticky until a later mouse leave
 * or an explicit category reset.
 */
export function shouldClearInspectionOnPointerLeave(args: {
  isFlipping: boolean
  leavePointerType: string
}): boolean {
  if (args.isFlipping) return false
  if (args.leavePointerType === 'touch') return false
  return true
}

/** Sound only when the caller opts in — avoids double-clicks from enter+up. */
export function shouldPlayEngageSound(options?: SkillEngageOptions): boolean {
  return Boolean(options?.playSound)
}
