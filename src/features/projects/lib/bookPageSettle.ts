/** Shortest absolute angular distance (radians). */
export function angleError(current: number, target: number): number {
  let delta = (target - current) % (Math.PI * 2)
  if (delta > Math.PI) delta -= Math.PI * 2
  if (delta < -Math.PI) delta += Math.PI * 2
  return Math.abs(delta)
}

/** Bone pose is considered settled when error is below this tolerance. */
export const BONE_SETTLE_TOLERANCE = 0.012

export function isBonePoseSettled(
  currentY: number,
  targetY: number,
  currentX: number,
  targetX: number,
  tolerance = BONE_SETTLE_TOLERANCE,
): boolean {
  return (
    angleError(currentY, targetY) <= tolerance &&
    angleError(currentX, targetX) <= tolerance
  )
}

/**
 * Book close / interaction unlock:
 * target page reached, delayed visual index caught up, bones converged.
 */
export function isBookFullySettled(args: {
  targetPage: number
  visualPage: number
  bonesSettled: boolean
}): boolean {
  return (
    args.targetPage === args.visualPage &&
    args.bonesSettled
  )
}
