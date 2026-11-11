// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  canCloseStory,
  canOpenStory,
  createStoryFocusFlipTracker,
  findStoryCardFrame,
  isStoryFocusActive,
  isStoryFocusBusy,
  lerpStoryFocusRect,
  measureContentSizedHeight,
  STORY_FOCUS_MOTION,
  storyFocusRectsEqual,
  storyRevealDelay,
  type StoryFocusPhase,
  type StoryFocusRect,
} from './storyFocusTransition'

describe('story focus transition phases', () => {
  it('allows open only from explore and close only from focused', () => {
    expect(canOpenStory('explore')).toBe(true)
    expect(canOpenStory('opening')).toBe(false)
    expect(canOpenStory('focused')).toBe(false)
    expect(canCloseStory('focused')).toBe(true)
    expect(canCloseStory('explore')).toBe(false)
    expect(canCloseStory('opening')).toBe(false)
  })

  it('marks transition phases as busy / active correctly', () => {
    const phases: StoryFocusPhase[] = ['explore', 'opening', 'focused', 'closing']
    expect(phases.map(isStoryFocusBusy)).toEqual([false, true, false, true])
    expect(phases.map(isStoryFocusActive)).toEqual([false, true, true, true])
  })

  it('keeps open/close motion in the premium choreography window', () => {
    expect(STORY_FOCUS_MOTION.open).toBeGreaterThanOrEqual(0.6)
    expect(STORY_FOCUS_MOTION.open).toBeLessThanOrEqual(0.75)
    expect(STORY_FOCUS_MOTION.close).toBeGreaterThanOrEqual(0.5)
    expect(STORY_FOCUS_MOTION.close).toBeLessThanOrEqual(0.65)
    expect(storyRevealDelay()).toBeCloseTo(
      STORY_FOCUS_MOTION.open * STORY_FOCUS_MOTION.revealAt,
    )
  })

  it('prefers the measure plane when measuring a story card', () => {
    const root = document.createElement('div')
    const card = document.createElement('div')
    card.setAttribute('data-cc-index', '1')
    const frame = document.createElement('div')
    frame.className = 'circular-carousel__frame'
    const measure = document.createElement('div')
    measure.className = 'circular-carousel__measure'
    card.append(frame, measure)
    root.appendChild(card)
    document.body.appendChild(root)

    expect(findStoryCardFrame(root, 1)).toBe(measure)

    measure.remove()
    expect(findStoryCardFrame(root, 1)).toBe(frame)

    root.remove()
  })

  it('measures overlay height from content at a target width', () => {
    const overlay = document.createElement('div')
    overlay.style.width = '200px'
    overlay.style.height = '120px'
    const article = document.createElement('article')
    article.className = 'skills-story-expanded'
    article.style.height = '100%'
    article.textContent = 'Story body'
    Object.defineProperty(article, 'scrollHeight', { configurable: true, value: 420 })
    Object.defineProperty(overlay, 'scrollHeight', { configurable: true, value: 420 })
    overlay.appendChild(article)
    document.body.appendChild(overlay)

    const height = measureContentSizedHeight(overlay, 480)

    expect(height).toBe(420)
    expect(overlay.style.width).toBe('200px')
    expect(overlay.style.height).toBe('120px')
    expect(article.style.height).toBe('100%')

    overlay.remove()
  })
})

describe('story focus FLIP geometry', () => {
  const from: StoryFocusRect = { left: 0, top: 0, width: 100, height: 200 }
  const to: StoryFocusRect = { left: 40, top: 20, width: 300, height: 400 }

  it('lerps source → target with a single progress value', () => {
    expect(lerpStoryFocusRect(from, to, 0)).toEqual(from)
    expect(lerpStoryFocusRect(from, to, 1)).toEqual(to)
    expect(lerpStoryFocusRect(from, to, 0.5)).toEqual({
      left: 20,
      top: 10,
      width: 200,
      height: 300,
    })
  })

  it('tracks a moving target with one rect read per sample', () => {
    let reads = 0
    let live: StoryFocusRect = { ...to }
    const flip = createStoryFocusFlipTracker({
      from,
      readTarget: () => {
        reads += 1
        return { ...live }
      },
    })

    expect(flip.sample(0)).toEqual(from)
    expect(flip.sample(0.5).width).toBe(200)
    // One getBoundingClientRect-equivalent per sample (not four property getters).
    const before = reads
    flip.sample(0.75)
    expect(reads).toBe(before + 1)

    live = { left: 80, top: 40, width: 400, height: 500 }
    const end = flip.sample(1)
    expect(end).toEqual(live)
    expect(storyFocusRectsEqual(end, live)).toBe(true)
    expect(storyFocusRectsEqual(from, to)).toBe(false)
  })
})
