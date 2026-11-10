/**
 * Offsets (px) to move each word from its CSS-settled position into a centered vertical stack.
 * Measures layout with getBoundingClientRect — word elements must have x/y transforms cleared
 * (and scale at 1) so rects reflect CSS-settled positions, not an in-progress scrub state.
 */
export function measureTypeClusterOffsets(
  stage: HTMLElement,
  words: HTMLElement[],
  gapPx = 6,
): { x: number; y: number }[] {
  if (words.length === 0) return []

  const stageRect = stage.getBoundingClientRect()
  const cx = stageRect.width / 2

  const metrics = words.map((word) => {
    const rect = word.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2 - stageRect.left
    const centerY = rect.top + rect.height / 2 - stageRect.top
    return { centerX, centerY, height: rect.height }
  })

  const totalHeight =
    metrics.reduce((sum, m) => sum + m.height, 0) + gapPx * Math.max(0, words.length - 1)
  let yCursor = stageRect.height / 2 - totalHeight / 2

  return metrics.map((m, index) => {
    const targetCenterY = yCursor + m.height / 2
    yCursor += m.height + (index < words.length - 1 ? gapPx : 0)
    return {
      x: cx - m.centerX,
      y: targetCenterY - m.centerY,
    }
  })
}
