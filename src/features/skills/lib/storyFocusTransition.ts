export const STORY_FOCUS_PHASES = [
  'explore',
  'opening',
  'focused',
  'closing',
] as const

export type StoryFocusPhase = (typeof STORY_FOCUS_PHASES)[number]

/** Shared-element open/close timing (seconds). */
export const STORY_FOCUS_MOTION = {
  open: 0.68,
  close: 0.56,
  lift: 0.14,
  revealAt: 0.72,
  contentFade: 0.2,
  /** Short — grid already shrinking; only enough for a side-card focus nudge. */
  alignWaitMs: 90,
  ease: 'power3.inOut',
} as const

export function storyRevealDelay(openSeconds = STORY_FOCUS_MOTION.open): number {
  return openSeconds * STORY_FOCUS_MOTION.revealAt
}

export function isStoryFocusBusy(phase: StoryFocusPhase): boolean {
  return phase === 'opening' || phase === 'closing'
}

export function isStoryFocusActive(phase: StoryFocusPhase): boolean {
  return phase === 'opening' || phase === 'focused' || phase === 'closing'
}

export function canOpenStory(phase: StoryFocusPhase): boolean {
  return phase === 'explore'
}

export function canCloseStory(phase: StoryFocusPhase): boolean {
  return phase === 'focused'
}

export type StoryFocusRect = {
  left: number
  top: number
  width: number
  height: number
}

export function readElementRect(node: Element | null): StoryFocusRect | null {
  if (!node) return null
  const rect = node.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) return null
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Interpolate shared-element geometry for one animation progress value. */
export function lerpStoryFocusRect(
  from: StoryFocusRect,
  to: StoryFocusRect,
  t: number,
): StoryFocusRect {
  const p = Math.min(1, Math.max(0, t))
  return {
    left: lerp(from.left, to.left, p),
    top: lerp(from.top, to.top, p),
    width: lerp(from.width, to.width, p),
    height: lerp(from.height, to.height, p),
  }
}

export function storyFocusRectsEqual(
  a: StoryFocusRect,
  b: StoryFocusRect,
  epsilonPx = 0.5,
): boolean {
  return (
    Math.abs(a.left - b.left) <= epsilonPx &&
    Math.abs(a.top - b.top) <= epsilonPx &&
    Math.abs(a.width - b.width) <= epsilonPx &&
    Math.abs(a.height - b.height) <= epsilonPx
  )
}

/**
 * Live FLIP tracker: one progress driver, one target read per update,
 * cached when the focus slot has not moved.
 */
export function createStoryFocusFlipTracker(options: {
  from: StoryFocusRect
  readTarget: () => StoryFocusRect
}) {
  let from = options.from
  let cachedTarget = options.readTarget()

  return {
    setFrom(next: StoryFocusRect) {
      from = next
    },
    readTargetOnce(): StoryFocusRect {
      const next = options.readTarget()
      if (!storyFocusRectsEqual(next, cachedTarget)) {
        cachedTarget = next
      }
      return cachedTarget
    },
    sample(progress: number): StoryFocusRect {
      return lerpStoryFocusRect(from, this.readTargetOnce(), progress)
    },
    getCachedTarget: () => cachedTarget,
  }
}


/**
 * Prefer the invisible measure plane for FLIP bounds.
 * Fall back to the first curved tile frame.
 */
export function findStoryCardFrame(
  root: ParentNode | null,
  index: number,
): HTMLElement | null {
  if (!root) return null
  const card = root.querySelector(`[data-cc-index="${index}"]`)
  if (!card) return null
  return (
    card.querySelector<HTMLElement>('.circular-carousel__measure') ??
    card.querySelector<HTMLElement>('.circular-carousel__frame')
  )
}

/**
 * Measure the expanded overlay at a target width with height driven by content.
 * Temporarily clears fixed heights so scroll/offset height reflects natural size.
 */
export function measureContentSizedHeight(
  overlay: HTMLElement,
  targetWidth: number,
): number {
  const article = overlay.querySelector<HTMLElement>('.skills-story-expanded')
  const prevOverlay = {
    width: overlay.style.width,
    height: overlay.style.height,
  }
  const prevArticleHeight = article?.style.height ?? ''

  overlay.style.width = `${Math.max(0, targetWidth)}px`
  overlay.style.height = 'auto'
  if (article) article.style.height = 'auto'

  const height = Math.ceil(
    Math.max(overlay.scrollHeight, article?.scrollHeight ?? 0, 1),
  )

  overlay.style.width = prevOverlay.width
  overlay.style.height = prevOverlay.height
  if (article) article.style.height = prevArticleHeight

  return height
}
