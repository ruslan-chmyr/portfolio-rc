import { useCallback, useEffect, useRef, useState } from 'react'
import keyClickUrl from '../../../assets/sounds/key-click.m4a'
import { createKeyboardSoundController } from '../lib/keyboardSound'

/**
 * Macropad click sounds — enabled by default; user can mute via the toggle.
 */
export function useKeyboardSound() {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const controllerRef = useRef<ReturnType<typeof createKeyboardSoundController> | null>(
    null,
  )

  useEffect(() => {
    const controller = createKeyboardSoundController(keyClickUrl)
    controller.setEnabled(true)
    controllerRef.current = controller
    return () => {
      controller.dispose()
      controllerRef.current = null
    }
  }, [])

  useEffect(() => {
    controllerRef.current?.setEnabled(soundEnabled)
  }, [soundEnabled])

  const playKeyClick = useCallback(() => {
    controllerRef.current?.playClick()
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => !current)
  }, [])

  return {
    soundEnabled,
    toggleSound,
    setSoundEnabled,
    playKeyClick,
  }
}
