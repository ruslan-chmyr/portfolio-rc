import { beforeEach, describe, expect, it } from 'vitest'
import { createIntroScrollHandoff } from './createIntroScrollHandoff'

describe('createIntroScrollHandoff', () => {
  let root: HTMLDivElement

  beforeEach(() => {
    root = document.createElement('div')
    root.className = 'intro-animation'
    document.documentElement.classList.remove('portfolio-native-scroll')
  })

  it('starts in intro capture mode', () => {
    const handoff = createIntroScrollHandoff(root)
    expect(handoff.isCapturing()).toBe(true)
    expect(document.documentElement.classList.contains('portfolio-native-scroll')).toBe(false)
  })

  it('releases portfolio scroll and hides intro root', () => {
    const handoff = createIntroScrollHandoff(root)
    handoff.releaseForward()
    expect(handoff.isCapturing()).toBe(false)
    expect(document.documentElement.classList.contains('portfolio-native-scroll')).toBe(true)
    expect(root.classList.contains('intro-animation--handed-off')).toBe(true)
  })

  it('reengages intro capture from portfolio scroll', () => {
    const handoff = createIntroScrollHandoff(root)
    handoff.releaseForward()
    handoff.reengage()
    expect(handoff.isCapturing()).toBe(true)
    expect(root.classList.contains('intro-animation--handed-off')).toBe(false)
  })

  it('dispatches reengage event for about cluster resync', () => {
    const handoff = createIntroScrollHandoff(root)
    handoff.releaseForward()
    let fired = false
    const onReengage = () => {
      fired = true
    }
    window.addEventListener('portfolio-scroll-reengage', onReengage)
    handoff.reengage()
    window.removeEventListener('portfolio-scroll-reengage', onReengage)
    expect(fired).toBe(true)
  })

  it('dispose clears portfolio-native-scroll classes', () => {
    const handoff = createIntroScrollHandoff(root)
    handoff.releaseForward()
    handoff.dispose()
    expect(handoff.isCapturing()).toBe(true)
    expect(document.documentElement.classList.contains('portfolio-native-scroll')).toBe(false)
    expect(root.classList.contains('intro-animation--handed-off')).toBe(false)
  })
})
