import gsap from 'gsap'
import {
  ABOUT_EXIT,
  ABOUT_FINAL_SHRINK_START,
  ABOUT_FRONTEND_JOIN_DELAY,
  ABOUT_TIMELINE,
  ABOUT_TYPE_ENTRANCE,
  aboutContentRevealStart,
  aboutFinalWordScale,
} from './aboutScrollConfig'

export type AboutScrollTimelineTargets = {
  pin: HTMLElement
  stage: HTMLElement
  senior: HTMLElement
  frontend: HTMLElement
  engineer: HTMLElement
  content: HTMLElement
  typeWords: HTMLElement[]
  revealEls: NodeListOf<HTMLElement>
  indexEl: HTMLElement | null
  ambientReveal: HTMLElement | null
}

export function buildAboutScrollTimeline(
  timeline: gsap.core.Timeline,
  targets: AboutScrollTimelineTargets,
) {
  const {
    pin,
    stage,
    senior,
    frontend,
    engineer,
    content,
    typeWords,
    revealEls,
    indexEl,
    ambientReveal,
  } = targets

  const {
    scaleRevealEnd,
    introEnd,
    splitStart,
    splitEnd,
    contentRevealDuration,
    settledStart,
    exitStart,
  } = ABOUT_TIMELINE
  const splitSpan = splitEnd - splitStart
  const holdSpan = introEnd - scaleRevealEnd
  const contentStart = aboutContentRevealStart()
  const frontendJoinAt = splitStart + splitSpan * ABOUT_FRONTEND_JOIN_DELAY
  const frontendMoveSpan = splitSpan * (1 - ABOUT_FRONTEND_JOIN_DELAY)
  const finalShrinkSpan = Math.max(0.18, exitStart - ABOUT_FINAL_SHRINK_START)
  const settleHold = Math.max(0.01, exitStart - settledStart)

  timeline.to(
    stage,
    {
      scale: 1,
      y: 0,
      autoAlpha: 1,
      duration: scaleRevealEnd,
      ease: 'power2.out',
    },
    0,
  )
  timeline.to(stage, { scale: 1, y: 0, duration: holdSpan }, scaleRevealEnd)

  timeline.to(senior, { x: 0, y: 0, duration: splitSpan, ease: 'power1.inOut' }, splitStart)
  timeline.to(
    frontend,
    { x: 0, y: 0, duration: frontendMoveSpan, ease: 'power1.inOut' },
    frontendJoinAt,
  )
  timeline.to(engineer, { x: 0, y: 0, duration: splitSpan, ease: 'power1.inOut' }, splitStart)

  timeline.to(
    typeWords,
    {
      scale: aboutFinalWordScale(),
      duration: finalShrinkSpan,
      ease: 'power1.inOut',
    },
    ABOUT_FINAL_SHRINK_START,
  )

  timeline.to(content, { autoAlpha: 0, duration: contentStart }, 0)
  timeline.to(revealEls, { autoAlpha: 0, y: 32, duration: contentStart }, 0)
  if (indexEl) timeline.to(indexEl, { autoAlpha: 0, duration: contentStart }, 0)
  if (ambientReveal) timeline.to(ambientReveal, { autoAlpha: 0, duration: contentStart }, 0)

  // Soft gate — keeps scrub ownership without a hard one-frame pop.
  timeline.to(
    content,
    { autoAlpha: 1, duration: 0.035, ease: 'power1.out' },
    contentStart,
  )
  timeline.to(
    revealEls,
    {
      autoAlpha: 1,
      y: 0,
      duration: contentRevealDuration,
      stagger: 0.07,
      ease: 'power2.out',
    },
    contentStart,
  )
  if (indexEl) {
    timeline.to(
      indexEl,
      { autoAlpha: 1, duration: contentRevealDuration * 0.65, ease: 'power2.out' },
      contentStart + 0.04,
    )
  }
  if (ambientReveal) {
    timeline.to(
      ambientReveal,
      {
        autoAlpha: 1,
        duration: contentRevealDuration * 0.85,
        ease: 'power2.out',
      },
      contentStart + 0.1,
    )
  }

  // Hold the presented About frame briefly, then exit into Skills.
  timeline.to(revealEls, { autoAlpha: 1, y: 0, duration: settleHold }, settledStart)

  // Exit — secondary copy first, ambient next, hero type last; pin crossfades to Skills navy.
  timeline.to(
    revealEls,
    {
      autoAlpha: 0,
      y: ABOUT_EXIT.secondaryY,
      duration: ABOUT_EXIT.secondaryDuration,
      ease: 'power2.inOut',
    },
    exitStart,
  )
  timeline.to(
    content,
    {
      autoAlpha: 0,
      duration: ABOUT_EXIT.secondaryDuration,
      ease: 'power2.inOut',
    },
    exitStart,
  )
  if (indexEl) {
    timeline.to(
      indexEl,
      {
        autoAlpha: 0,
        duration: ABOUT_EXIT.secondaryDuration,
        ease: 'power2.inOut',
      },
      exitStart,
    )
  }
  if (ambientReveal) {
    timeline.to(
      ambientReveal,
      {
        autoAlpha: 0,
        y: ABOUT_EXIT.secondaryY * 0.6,
        duration: ABOUT_EXIT.ambientDuration,
        ease: 'power2.inOut',
      },
      exitStart + 0.01,
    )
  }
  timeline.to(
    typeWords,
    {
      autoAlpha: 0,
      y: ABOUT_EXIT.typeY,
      duration: ABOUT_EXIT.typeDuration,
      ease: 'power2.inOut',
    },
    exitStart + 0.02,
  )
  timeline.to(
    stage,
    {
      autoAlpha: 0,
      y: ABOUT_EXIT.typeY * 0.5,
      duration: ABOUT_EXIT.typeDuration,
      ease: 'power2.inOut',
    },
    exitStart + 0.02,
  )
  timeline.to(
    pin,
    {
      backgroundColor: ABOUT_EXIT.pinExitColor,
      duration: ABOUT_EXIT.pinFadeDuration,
      ease: 'power2.inOut',
    },
    exitStart,
  )
}

export function setAboutScrollInitialStates(
  targets: AboutScrollTimelineTargets,
  indexEl: HTMLElement | null,
  ambientReveal: HTMLElement | null,
) {
  const { stage, content, revealEls } = targets
  gsap.set(stage, {
    scale: ABOUT_TYPE_ENTRANCE.fromScale,
    y: ABOUT_TYPE_ENTRANCE.fromY,
    autoAlpha: ABOUT_TYPE_ENTRANCE.fromOpacity,
  })
  gsap.set(content, { autoAlpha: 0 })
  gsap.set(revealEls, { autoAlpha: 0, y: 32 })
  if (indexEl) gsap.set(indexEl, { autoAlpha: 0 })
  if (ambientReveal) gsap.set(ambientReveal, { autoAlpha: 0 })
}
