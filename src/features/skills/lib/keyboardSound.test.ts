import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  KEYBOARD_SOUND_MIN_INTERVAL_MS,
  createKeyboardSoundController,
} from './keyboardSound'

class FakeAudio {
  static instances: FakeAudio[] = []
  preload = ''
  volume = 1
  currentTime = 0
  src = ''
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()

  constructor(src?: string) {
    this.src = src ?? ''
    FakeAudio.instances.push(this)
  }
}

describe('createKeyboardSoundController', () => {
  const OriginalAudio = globalThis.Audio

  beforeEach(() => {
    FakeAudio.instances = []
    vi.stubGlobal('Audio', FakeAudio)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    globalThis.Audio = OriginalAudio
  })

  it('stays silent while muted and plays after enable', () => {
    const controller = createKeyboardSoundController('/key-click.m4a', {
      poolSize: 2,
      minIntervalMs: 0,
    })

    controller.playClick()
    expect(FakeAudio.instances).toHaveLength(0)

    controller.setEnabled(true)
    controller.playClick()
    expect(FakeAudio.instances).toHaveLength(2)
    expect(FakeAudio.instances[0]?.play).toHaveBeenCalledTimes(1)

    controller.dispose()
  })

  it('throttles rapid clicks and fails play() silently', async () => {
    let now = 1_000
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const controller = createKeyboardSoundController('/key-click.m4a', {
      poolSize: 1,
      minIntervalMs: KEYBOARD_SOUND_MIN_INTERVAL_MS,
    })
    controller.setEnabled(true)

    const first = FakeAudio.instances[0]
    expect(first).toBeTruthy()
    first!.play.mockImplementationOnce(() => Promise.reject(new Error('autoplay')))

    expect(() => controller.playClick()).not.toThrow()
    expect(first!.play).toHaveBeenCalledTimes(1)
    await Promise.resolve()

    controller.playClick()
    expect(first!.play).toHaveBeenCalledTimes(1)

    now = 1_000 + KEYBOARD_SOUND_MIN_INTERVAL_MS + 1
    first!.play.mockImplementationOnce(() => Promise.resolve())
    controller.playClick()
    expect(first!.play).toHaveBeenCalledTimes(2)

    controller.dispose()
  })
})
