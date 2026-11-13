import { useEffect, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  defaultCameraPosition,
  defaultCameraTarget,
  clampZoomDistance,
} from '../../lib/bookCamera'
import { setBookOrbiting } from '../../lib/bookGesture'
import { PROJECT_BOOK_CAMERA } from '../../model/projectBookConfig'
import { useBookGesture } from './BookGestureContext'

type BookOrbitRigProps = {
  resetNonce: number
  reducedMotion: boolean
}

/**
 * 360° orbit + constrained zoom.
 * Wheel zoom only with Ctrl/Cmd on fine pointers so portfolio scrub scroll stays intact.
 * Coarse pointers get pinch zoom via OrbitControls.
 */
export function BookOrbitRig({ resetNonce, reducedMotion }: BookOrbitRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera, gl, size, invalidate } = useThree()
  const { gesture, bumpActivity } = useBookGesture()
  const coarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches

  // Initial framing from viewport aspect.
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const pos = defaultCameraPosition(aspect)
    const target = defaultCameraTarget()
    camera.position.set(pos.x, pos.y, pos.z)
    camera.lookAt(target.x, target.y, target.z)
    const controls = controlsRef.current
    if (controls) {
      controls.target.set(target.x, target.y, target.z)
      controls.update()
    }
    invalidate()
  }, [camera, invalidate, size.height, size.width])

  // Smooth reset to default framing (preserves book page outside this component).
  useEffect(() => {
    if (resetNonce === 0) return
    const controls = controlsRef.current
    if (!controls) return
    const aspect = size.width / Math.max(1, size.height)
    const pos = defaultCameraPosition(aspect)
    const target = defaultCameraTarget()
    const duration = reducedMotion ? 0 : PROJECT_BOOK_CAMERA.resetDurationMs
    const start = performance.now()
    const fromPos = camera.position.clone()
    const fromTarget = controls.target.clone()

    let raf = 0
    const tick = (now: number) => {
      const t =
        duration <= 0 ? 1 : Math.min(1, (now - start) / duration)
      const e = t * t * (3 - 2 * t)
      camera.position.set(
        fromPos.x + (pos.x - fromPos.x) * e,
        fromPos.y + (pos.y - fromPos.y) * e,
        fromPos.z + (pos.z - fromPos.z) * e,
      )
      controls.target.set(
        fromTarget.x + (target.x - fromTarget.x) * e,
        fromTarget.y + (target.y - fromTarget.y) * e,
        fromTarget.z + (target.z - fromTarget.z) * e,
      )
      controls.update()
      bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
      invalidate()
      if (t < 1) raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [
    bumpActivity,
    camera,
    invalidate,
    reducedMotion,
    resetNonce,
    size.height,
    size.width,
  ])

  // Ctrl/Cmd + wheel dolly on fine pointers (does not steal normal section scroll).
  useEffect(() => {
    if (coarsePointer) return
    const el = gl.domElement
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      event.preventDefault()
      event.stopPropagation()
      const controls = controlsRef.current
      if (!controls) return
      const offset = camera.position.clone().sub(controls.target)
      const dist = offset.length()
      const next = clampZoomDistance(
        dist * (event.deltaY > 0 ? 1.06 : 0.94),
      )
      offset.setLength(next)
      camera.position.copy(controls.target).add(offset)
      controls.update()
      bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
      invalidate()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [bumpActivity, camera, coarsePointer, gl.domElement, invalidate])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      enablePan={false}
      enableZoom={coarsePointer}
      minDistance={PROJECT_BOOK_CAMERA.minDistance}
      maxDistance={PROJECT_BOOK_CAMERA.maxDistance}
      minPolarAngle={PROJECT_BOOK_CAMERA.minPolar}
      maxPolarAngle={PROJECT_BOOK_CAMERA.maxPolar}
      target={[
        PROJECT_BOOK_CAMERA.target.x,
        PROJECT_BOOK_CAMERA.target.y,
        PROJECT_BOOK_CAMERA.target.z,
      ]}
      // Do not capture page-level wheel on desktop.
      enableRotate
      onStart={() => {
        setBookOrbiting(gesture.current, true)
        bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
      }}
      onChange={() => {
        bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
        invalidate()
      }}
      onEnd={() => {
        setBookOrbiting(gesture.current, false)
        bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
        invalidate()
      }}
    />
  )
}
