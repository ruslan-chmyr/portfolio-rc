export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const smooth01 = (t: number) => t * t * (3 - 2 * t)
