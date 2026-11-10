import gsap from 'gsap'
import { measureTypeClusterOffsets } from './aboutTypeLayout'

/**
 * Moves headline words into the centered intro cluster.
 * Callers must reset word transforms before measuring; this helper clears x/y
 * (not timeline-driven scale) so layout reads match CSS-settled positions.
 */
export function syncTypeClusterLayout(stage: HTMLElement, typeWords: HTMLElement[]) {
  gsap.set(typeWords, {
    x: 0,
    y: 0,
    scale: 1,
    autoAlpha: 1,
    transformOrigin: '50% 50%',
  })
  const offsets = measureTypeClusterOffsets(stage, typeWords)
  typeWords.forEach((word, i) => {
    gsap.set(word, { x: offsets[i]?.x ?? 0, y: offsets[i]?.y ?? 0 })
  })
}
