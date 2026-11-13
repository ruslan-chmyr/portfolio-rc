import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from 'react'
import { flushSync } from 'react-dom'
import gsap from 'gsap'
import {
  canCloseStory,
  canOpenStory,
  createStoryFocusFlipTracker,
  findStoryCardFrame,
  isStoryFocusActive,
  isStoryFocusBusy,
  readElementRect,
  STORY_FOCUS_MOTION,
  storyRevealDelay,
  type StoryFocusPhase,
  type StoryFocusRect,
} from '../../lib/storyFocusTransition'
import {
  engineeringStories,
  getEngineeringStory,
  getStoryCarouselItems,
  storyCategoryLabel,
  type EngineeringStoryId,
} from '../../model/storiesConfig'
import { CircularCarousel, type CircularCarouselItem } from './CircularCarousel'
import { StoryExpandedCard } from './StoryExpandedCard'
import './stories.css'

type StoriesPanelProps = {
  panelRef?: Ref<HTMLElement | null>
  focusedStoryId: EngineeringStoryId | null
  reducedMotion: boolean
  onOpenStory: (storyId: EngineeringStoryId) => void
  onCloseStoryStart?: () => void
  onCloseStory: () => void
  onFocusPhaseChange?: (phase: StoryFocusPhase) => void
}

function gridTracksForMode(mode: 'explore' | 'story-focus') {
  return mode === 'story-focus'
    ? { keyboard: '42fr', stories: '58fr' }
    : { keyboard: '1fr', stories: '1fr' }
}

function applyGridModeInstant(
  mode: 'explore' | 'story-focus',
) {
  const section = document.getElementById('expertise')
  if (!section) return null
  const tracks = gridTracksForMode(mode)
  section.setAttribute('data-skills-mode', mode)
  gsap.killTweensOf(section)
  gsap.set(section, {
    '--skills-keyboard-track': tracks.keyboard,
    '--skills-stories-track': tracks.stories,
  })
  return section
}

/** Mark mode + kill stray track tweens; caller owns the shared timeline tween. */
function prepareGridMode(mode: 'explore' | 'story-focus') {
  const section = document.getElementById('expertise')
  if (!section) return null
  section.setAttribute('data-skills-mode', mode)
  gsap.killTweensOf(section)
  return section
}

function waitMs(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function StoriesPanel({
  panelRef,
  focusedStoryId,
  reducedMotion,
  onOpenStory,
  onCloseStoryStart,
  onCloseStory,
  onFocusPhaseChange,
}: StoriesPanelProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const focusSlotRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef<HTMLElement>(null)
  const closeButtonPendingFocus = useRef(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const sourceIndexRef = useRef<number | null>(null)
  const closingFromParentRef = useRef(false)
  const openGenerationRef = useRef(0)

  const [phase, setPhase] = useState<StoryFocusPhase>('explore')
  const [ghostIndex, setGhostIndex] = useState<number | null>(null)
  const [overlayStoryId, setOverlayStoryId] = useState<EngineeringStoryId | null>(
    null,
  )
  const [contentVisible, setContentVisible] = useState(false)
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties | null>(null)

  const items = useMemo(() => {
    const base = getStoryCarouselItems()
    return base.map((item, index) => {
      const story = engineeringStories[index]
      const categoryLabel = story ? storyCategoryLabel(story.category) : ''
      return {
        ...item,
        eyebrow: `Highlight ${String(index + 1).padStart(2, '0')} · ${categoryLabel}`,
        cta: 'Explore Highlight',
      } satisfies CircularCarouselItem
    })
  }, [])

  const overlayStory = getEngineeringStory(overlayStoryId)
  const overlayIndexLabel =
    overlayStoryId != null
      ? String(
          Math.max(
            0,
            engineeringStories.findIndex((story) => story.id === overlayStoryId),
          ) + 1,
        ).padStart(2, '0')
      : '01'

  const focusActive = isStoryFocusActive(phase)
  const busy = isStoryFocusBusy(phase)

  useEffect(() => {
    onFocusPhaseChange?.(phase)
  }, [phase, onFocusPhaseChange])

  useEffect(() => {
    return () => {
      timelineRef.current?.kill()
      openGenerationRef.current += 1
    }
  }, [])

  useLayoutEffect(() => {
    if (!contentVisible || !closeButtonPendingFocus.current) return
    closeButtonPendingFocus.current = false
    expandedRef.current
      ?.querySelector<HTMLButtonElement>('.skills-story-expanded__close')
      ?.focus()
  }, [contentVisible])

  const killTimeline = () => {
    timelineRef.current?.kill()
    timelineRef.current = null
  }

  const settleFocusedOverlay = () => {
    const overlay = overlayRef.current
    if (overlay) {
      gsap.set(overlay, { clearProps: 'transform,y' })
    }
    setOverlayStyle({
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      borderRadius: 24,
      zIndex: 2,
      pointerEvents: 'auto',
      boxShadow:
        '0 18px 48px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.06)',
    })
    setContentVisible(true)
    setPhase('focused')
    closeButtonPendingFocus.current = true
  }

  const readFocusTarget = useCallback((fallback: StoryFocusRect): StoryFocusRect => {
    return (
      readElementRect(focusSlotRef.current) ?? {
        left: fallback.left,
        top: fallback.top,
        width: Math.max(fallback.width * 1.45, 440),
        height: Math.max(fallback.height * 1.3, 540),
      }
    )
  }, [])

  const beginOpen = useCallback(
    async (
      storyId: EngineeringStoryId,
      index: number,
      sourceRect: StoryFocusRect,
    ) => {
      if (!canOpenStory(phase)) return
      const generation = ++openGenerationRef.current
      killTimeline()
      sourceIndexRef.current = index
      setGhostIndex(index)
      setOverlayStoryId(storyId)
      setContentVisible(false)
      setPhase('opening')

      setOverlayStyle({
        position: 'fixed',
        left: sourceRect.left,
        top: sourceRect.top,
        width: sourceRect.width,
        height: sourceRect.height,
        borderRadius: 24,
        zIndex: 40,
        pointerEvents: 'none',
        boxShadow:
          '0 10px 28px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      })

      // Commit category flip before GSAP so keyboard flip + column shrink start together.
      flushSync(() => {
        onOpenStory(storyId)
      })

      if (reducedMotion) {
        applyGridModeInstant('story-focus')
      } else {
        prepareGridMode('story-focus')
      }

      // Brief align wait so side cards can face forward before the shared FLIP.
      if (!reducedMotion) {
        await waitMs(STORY_FOCUS_MOTION.alignWaitMs)
      }
      if (generation !== openGenerationRef.current) return

      const aligned =
        readElementRect(findStoryCardFrame(stageRef.current, index)) ?? sourceRect
      const overlay = overlayRef.current
      if (!overlay) {
        settleFocusedOverlay()
        return
      }

      gsap.set(overlay, {
        left: aligned.left,
        top: aligned.top,
        width: aligned.width,
        height: aligned.height,
        borderRadius: 24,
        y: 0,
      })

      if (reducedMotion) {
        const target = readFocusTarget(aligned)
        gsap.set(overlay, {
          left: target.left,
          top: target.top,
          width: target.width,
          height: target.height,
          borderRadius: 24,
        })
        settleFocusedOverlay()
        return
      }

      const section = prepareGridMode('story-focus')
      const tracks = gridTracksForMode('story-focus')
      const flip = createStoryFocusFlipTracker({
        from: aligned,
        readTarget: () => readFocusTarget(aligned),
      })
      const progress = { t: 0 }

      const tl = gsap.timeline({
        onComplete: () => {
          if (generation !== openGenerationRef.current) return
          settleFocusedOverlay()
          timelineRef.current = null
        },
      })
      timelineRef.current = tl

      // Phase A — lift / deepen without scaling typography.
      tl.to(
        overlay,
        {
          y: -6,
          boxShadow:
            '0 22px 48px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          duration: STORY_FOCUS_MOTION.lift,
          ease: 'power2.out',
        },
        0,
      )

      const expandAt = STORY_FOCUS_MOTION.lift * 0.35

      // Phase B — one progress driver; re-read live focus-slot bounds each update.
      tl.to(
        progress,
        {
          t: 1,
          duration: STORY_FOCUS_MOTION.open,
          ease: STORY_FOCUS_MOTION.ease,
          onUpdate: () => {
            const rect = flip.sample(progress.t)
            gsap.set(overlay, {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              y: 0,
              borderRadius: 24,
              boxShadow:
                '0 18px 48px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.06)',
            })
          },
        },
        expandAt,
      )

      // Keep column tracks on the same timeline so layout and overlay stay locked.
      if (section) {
        tl.to(
          section,
          {
            '--skills-keyboard-track': tracks.keyboard,
            '--skills-stories-track': tracks.stories,
            duration: STORY_FOCUS_MOTION.open,
            ease: STORY_FOCUS_MOTION.ease,
          },
          expandAt,
        )
      }

      // Phase C — reveal HTML details after expansion is far enough.
      tl.call(
        () => {
          if (generation !== openGenerationRef.current) return
          setContentVisible(true)
          closeButtonPendingFocus.current = true
        },
        [],
        storyRevealDelay(),
      )
    },
    [onOpenStory, phase, readFocusTarget, reducedMotion],
  )

  const handleItemClick = (item: CircularCarouselItem, index: number) => {
    if (!canOpenStory(phase)) return
    const story =
      (item.id && engineeringStories.find((entry) => entry.id === item.id)) ||
      engineeringStories.find((entry) => entry.title === item.title)
    if (!story) return
    const frame = findStoryCardFrame(stageRef.current, index)
    const rect = readElementRect(frame)
    if (!rect) {
      sourceIndexRef.current = index
      setGhostIndex(index)
      setOverlayStoryId(story.id)
      flushSync(() => {
        onOpenStory(story.id)
      })
      applyGridModeInstant('story-focus')
      settleFocusedOverlay()
      return
    }
    void beginOpen(story.id, index, rect)
  }

  const handleClose = useCallback(() => {
    if (!canCloseStory(phase)) return
    const generation = ++openGenerationRef.current
    killTimeline()
    setContentVisible(false)
    setPhase('closing')

    const index = sourceIndexRef.current
    const overlay = overlayRef.current
    const frame =
      index != null ? findStoryCardFrame(stageRef.current, index) : null
    const end = readElementRect(frame)
    const current = readElementRect(overlay)

    if (!overlay || !end || !current || reducedMotion) {
      flushSync(() => {
        onCloseStoryStart?.()
      })
      applyGridModeInstant('explore')
      setOverlayStyle(null)
      setOverlayStoryId(null)
      setGhostIndex(null)
      setPhase('explore')
      onCloseStory()
      return
    }

    setOverlayStyle({
      position: 'fixed',
      left: current.left,
      top: current.top,
      width: current.width,
      height: current.height,
      borderRadius: 24,
      zIndex: 40,
      pointerEvents: 'none',
      boxShadow:
        '0 18px 48px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.06)',
    })

    requestAnimationFrame(() => {
      if (generation !== openGenerationRef.current) return
      // Flip + column expand start together, same as open.
      flushSync(() => {
        onCloseStoryStart?.()
      })
      const section = prepareGridMode('explore')
      const tracks = gridTracksForMode('explore')
      const node = overlayRef.current
      if (!node) {
        setOverlayStyle(null)
        setOverlayStoryId(null)
        setGhostIndex(null)
        setPhase('explore')
        onCloseStory()
        return
      }

      const flip = createStoryFocusFlipTracker({
        from: current,
        readTarget: () =>
          (index != null
            ? readElementRect(findStoryCardFrame(stageRef.current, index))
            : null) ?? end,
      })
      const progress = { t: 0 }

      const tl = gsap.timeline({
        onComplete: () => {
          if (generation !== openGenerationRef.current) return
          setOverlayStyle(null)
          setOverlayStoryId(null)
          setGhostIndex(null)
          setPhase('explore')
          onCloseStory()
          timelineRef.current = null
        },
      })
      timelineRef.current = tl

      // Fade detail first, then reverse shared-element toward live card bounds.
      tl.to({}, { duration: STORY_FOCUS_MOTION.contentFade })
      tl.to(
        progress,
        {
          t: 1,
          duration: STORY_FOCUS_MOTION.close,
          ease: STORY_FOCUS_MOTION.ease,
          onUpdate: () => {
            const rect = flip.sample(progress.t)
            gsap.set(node, {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              borderRadius: 24,
              boxShadow:
                '0 10px 28px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            })
          },
        },
        STORY_FOCUS_MOTION.contentFade,
      )

      if (section) {
        tl.to(
          section,
          {
            '--skills-keyboard-track': tracks.keyboard,
            '--skills-stories-track': tracks.stories,
            duration: STORY_FOCUS_MOTION.close,
            ease: STORY_FOCUS_MOTION.ease,
          },
          STORY_FOCUS_MOTION.contentFade,
        )
      }
    })
  }, [onCloseStory, onCloseStoryStart, phase, reducedMotion])

  // Parent cleared focus (e.g. category change) while a story was open.
  useEffect(() => {
    if (focusedStoryId != null) {
      closingFromParentRef.current = false
      return
    }
    if (phase === 'focused' && !closingFromParentRef.current) {
      closingFromParentRef.current = true
      handleClose()
    }
  }, [focusedStoryId, handleClose, phase])

  useEffect(() => {
    if (phase !== 'focused') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleClose, phase])

  return (
    <aside
      ref={panelRef}
      className={[
        'skills-section__stories-panel',
        focusActive ? 'skills-section__stories-panel--focus' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-skills-stories-slot
      aria-label="Engineering stories"
    >
      <div className="skills-stories__workspace">
        {!focusActive ? (
          <p className="skills-stories__eyebrow" aria-hidden="true">
            Engineering stories
          </p>
        ) : null}

        <div
          ref={stageRef}
          className={[
            'skills-stories__stage',
            focusActive ? 'skills-stories__stage--under' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden={focusActive}
        >
          <CircularCarousel
            items={items}
            preset="cylinder"
            intro={reducedMotion ? 'none' : 'rise'}
            autoplay={reducedMotion || busy || focusActive ? 'off' : 'drift'}
            speed={16}
            cardWidth={360}
            aspectRatio={0.68}
            gap={72}
            curve={0.88}
            tilt={-10}
            perspective={3600}
            captions={false}
            cardContent
            backfaces
            fitFill={0.97}
            pauseOnHover
            focusOnClick
            paused={busy || focusActive}
            interactionLocked={busy || focusActive}
            ghostIndex={ghostIndex}
            fadeColor="#07101c"
            innerShade={0.55}
            cornerRadius={24}
            depthFade={0.22}
            parallax={reducedMotion || focusActive ? 0 : 0.08}
            stretch={0}
            momentum={0.48}
            ariaLabel="Engineering stories carousel. Drag to explore, click or press Enter to open."
            onItemClick={handleItemClick}
          />
        </div>

        {!focusActive ? (
          <p className="skills-stories__hint" aria-hidden="true">
            Drag to explore
          </p>
        ) : null}

        <div
          ref={focusSlotRef}
          className={[
            'skills-stories__focus-slot',
            focusActive ? 'skills-stories__focus-slot--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden={!focusActive}
        >
          {overlayStory && overlayStyle ? (
            <div
              ref={overlayRef}
              className={[
                'skills-stories__expand-overlay',
                phase === 'focused' ? 'skills-stories__expand-overlay--settled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={overlayStyle}
            >
              <StoryExpandedCard
                ref={expandedRef}
                story={overlayStory}
                indexLabel={overlayIndexLabel}
                contentVisible={contentVisible}
                onClose={handleClose}
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
