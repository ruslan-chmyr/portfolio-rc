import gsap from 'gsap'
import { measureTypeClusterOffsets } from './aboutTypeLayout'

/**
 * Moves headline words into the centered intro cluster.
 * Measures with the stage at identity transform so getBoundingClientRect
 * matches CSS layout (not a scrubbed entrance scale).
 */
export function syncTypeClusterLayout(stage: HTMLElement, typeWords: HTMLElement[]) {
  const stageScale = Number(gsap.getProperty(stage, 'scale')) || 1
  const stageX = Number(gsap.getProperty(stage, 'x')) || 0
  const stageY = Number(gsap.getProperty(stage, 'y')) || 0
  const stageOpacity = Number(gsap.getProperty(stage, 'opacity'))

  gsap.set(stage, { scale: 1, x: 0, y: 0, opacity: 1 })
  gsap.set(typeWords, {
    x: 0,
    y: 0,
    scale: 1,
    autoAlpha: 1,
    transformOrigin: '50% 50%',
  })

  // Force layout so rects reflect cleared transforms.
  void stage.offsetWidth

  const offsets = measureTypeClusterOffsets(stage, typeWords)
  typeWords.forEach((word, i) => {
    gsap.set(word, { x: offsets[i]?.x ?? 0, y: offsets[i]?.y ?? 0 })
  })

  gsap.set(stage, {
    scale: stageScale,
    x: stageX,
    y: stageY,
    opacity: Number.isFinite(stageOpacity) ? stageOpacity : 1,
  })
}
