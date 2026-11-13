import { useEffect, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3, type Camera } from 'three'
import {
  defaultCameraPosition,
  defaultCameraTarget,
  clampZoomDistance,
  decideWheelZoom,
  resizePreserveOrbit,
} from '../../lib/bookCamera'
import {
  boundsFromDistance,
  toolbarZoomTarget,
  type BookCameraApi,
  type BookCameraBounds,
} from '../../lib/bookCameraApi'
import { setBookOrbiting } from '../../lib/bookGesture'
import { PROJECT_BOOK_CAMERA } from '../../model/projectBookConfig'
import { useBookGesture } from './BookGestureContext'

type BookOrbitRigProps = {
  resetNonce: number
  reducedMotion: boolean
}

function currentDistance(camera: Camera, target: Vector3): number {
  return camera.position.distanceTo(target)
}

function animateCameraDistance(args: {
  camera: Camera
  controls: OrbitControlsImpl
  toDistance: number
  durationMs: number
  bumpActivity: (ms?: number) => void
  invalidate: () => void
  onFrame?: (distance: number) => void
  scratch: Vector3
}): () => void {
  const {
    camera,
    controls,
    toDistance,
    durationMs,
    bumpActivity,
    invalidate,
    onFrame,
    scratch,
  } = args
  scratch.copy(camera.position).sub(controls.target)
  const from = scratch.length()
  const to = clampZoomDistance(toDistance)
  if (Math.abs(to - from) < 1e-4) return () => undefined

  const start = performance.now()
  let raf = 0
  const tick = (now: number) => {
    const t = durationMs <= 0 ? 1 : Math.min(1, (now - start) / durationMs)
    const e = t * t * (3 - 2 * t)
    const dist = from + (to - from) * e
    scratch.setLength(dist)
    camera.position.copy(controls.target).add(scratch)
    controls.update()
    onFrame?.(dist)
    bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
    invalidate()
    if (t < 1) raf = window.requestAnimationFrame(tick)
  }
  raf = window.requestAnimationFrame(tick)
  return () => window.cancelAnimationFrame(raf)
}

/**
 * 360° orbit + constrained zoom.
 * Exposes reset / zoomIn / zoomOut to the HTML toolbar via cameraApiRef.
 */
export function BookOrbitRig({ resetNonce, reducedMotion }: BookOrbitRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera, gl, size, invalidate } = useThree()
  const { gesture, bumpActivity, cameraApiRef } = useBookGesture()
  const listenersRef = useRef(new Set<(bounds: BookCameraBounds) => void>())
  const cancelZoomRef = useRef<(() => void) | null>(null)
  const framedRef = useRef(false)
  const sizeRef = useRef(size)
  const appliedSizeRef = useRef<{ width: number; height: number } | null>(null)
  const wheelOffset = useRef(new Vector3())
  const zoomScratch = useRef(new Vector3())
  const coarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches

  useEffect(() => {
    sizeRef.current = size
  }, [size])

  const publishBounds = (distance: number) => {
    const bounds = boundsFromDistance(distance)
    for (const listener of listenersRef.current) listener(bounds)
  }

  // Register imperative API for the toolbar (outside the Canvas tree).
  useEffect(() => {
    const api: BookCameraApi = {
      resetView: () => {
        // Driven by resetNonce in the parent.
      },
      zoomIn: () => {
        const controls = controlsRef.current
        if (!controls) return
        cancelZoomRef.current?.()
        const from = currentDistance(camera, controls.target)
        const to = toolbarZoomTarget(from, 'in')
        const duration = reducedMotion
          ? 0
          : PROJECT_BOOK_CAMERA.toolbarZoomDurationMs
        cancelZoomRef.current = animateCameraDistance({
          camera,
          controls,
          toDistance: to,
          durationMs: duration,
          bumpActivity,
          invalidate,
          onFrame: publishBounds,
          scratch: zoomScratch.current,
        })
      },
      zoomOut: () => {
        const controls = controlsRef.current
        if (!controls) return
        cancelZoomRef.current?.()
        const from = currentDistance(camera, controls.target)
        const to = toolbarZoomTarget(from, 'out')
        const duration = reducedMotion
          ? 0
          : PROJECT_BOOK_CAMERA.toolbarZoomDurationMs
        cancelZoomRef.current = animateCameraDistance({
          camera,
          controls,
          toDistance: to,
          durationMs: duration,
          bumpActivity,
          invalidate,
          onFrame: publishBounds,
          scratch: zoomScratch.current,
        })
      },
      getBounds: () => {
        const controls = controlsRef.current
        if (!controls) return boundsFromDistance(PROJECT_BOOK_CAMERA.maxDistance)
        return boundsFromDistance(currentDistance(camera, controls.target))
      },
      subscribe: (listener) => {
        listenersRef.current.add(listener)
        listener(api.getBounds())
        return () => {
          listenersRef.current.delete(listener)
        }
      },
    }
    const apiSlot = cameraApiRef
    apiSlot.current = api
    return () => {
      cancelZoomRef.current?.()
      apiSlot.current = {
        resetView: () => undefined,
        zoomIn: () => undefined,
        zoomOut: () => undefined,
        getBounds: () => boundsFromDistance(PROJECT_BOOK_CAMERA.maxDistance),
        subscribe: () => () => undefined,
      }
    }
  }, [bumpActivity, camera, cameraApiRef, invalidate, reducedMotion])

  // Initial framing once — never again on resize / fullscreen.
  useEffect(() => {
    if (framedRef.current) return
    const aspect = size.width / Math.max(1, size.height)
    const pos = defaultCameraPosition(aspect)
    const target = defaultCameraTarget()
    camera.position.set(pos.x, pos.y, pos.z)
    camera.lookAt(target.x, target.y, target.z)
    framedRef.current = true
    appliedSizeRef.current = { width: size.width, height: size.height }
    const controls = controlsRef.current
    if (controls) {
      controls.target.set(target.x, target.y, target.z)
      controls.update()
      publishBounds(currentDistance(camera, controls.target))
    }
    invalidate()
  }, [camera, invalidate, size.height, size.width])

  // Resize / fullscreen: preserve azimuth & polar; nudge distance only if clipping.
  useEffect(() => {
    if (!framedRef.current) return
    const applied = appliedSizeRef.current
    if (
      applied &&
      applied.width === size.width &&
      applied.height === size.height
    ) {
      return
    }
    const controls = controlsRef.current
    if (!controls) return
    appliedSizeRef.current = { width: size.width, height: size.height }
    const aspect = size.width / Math.max(1, size.height)
    const offset = wheelOffset.current
    offset.copy(camera.position).sub(controls.target)
    const next = resizePreserveOrbit({
      offsetX: offset.x,
      offsetY: offset.y,
      offsetZ: offset.z,
      aspect,
    })
    camera.position.set(
      controls.target.x + next.x,
      controls.target.y + next.y,
      controls.target.z + next.z,
    )
    controls.update()
    publishBounds(next.distance)
    bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
    invalidate()
  }, [bumpActivity, camera, invalidate, size.height, size.width])

  // Explicit Reset View — uses current viewport for default framing.
  useEffect(() => {
    if (resetNonce === 0) return
    const controls = controlsRef.current
    if (!controls) return
    cancelZoomRef.current?.()
    const { width, height } = sizeRef.current
    const aspect = width / Math.max(1, height)
    const pos = defaultCameraPosition(aspect)
    const target = defaultCameraTarget()
    const duration = reducedMotion ? 0 : PROJECT_BOOK_CAMERA.resetDurationMs
    const start = performance.now()
    const fromPos = camera.position.clone()
    const fromTarget = controls.target.clone()

    let raf = 0
    const tick = (now: number) => {
      const t = duration <= 0 ? 1 : Math.min(1, (now - start) / duration)
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
      publishBounds(currentDistance(camera, controls.target))
      bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
      invalidate()
      if (t < 1) raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [bumpActivity, camera, invalidate, reducedMotion, resetNonce])

  // Desktop wheel zoom — single owner (OrbitControls zoom disabled on fine pointers).
  useEffect(() => {
    const el = gl.domElement
    const onWheel = (event: WheelEvent) => {
      const controls = controlsRef.current
      if (!controls || !controls.enabled) return

      const offset = wheelOffset.current
      offset.copy(camera.position).sub(controls.target)
      const dist = offset.length()
      const decision = decideWheelZoom({
        deltaY: event.deltaY,
        distance: dist,
        coarsePointer,
        ctrlOrMeta: event.ctrlKey || event.metaKey,
      })

      if (decision.action === 'allow-scroll') return
      if (decision.action === 'ignore') {
        if (!coarsePointer && event.deltaY < 0) {
          event.preventDefault()
          event.stopPropagation()
        }
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const next = clampZoomDistance(dist * decision.factor)
      if (Math.abs(next - dist) < 1e-4) return
      offset.setLength(next)
      camera.position.copy(controls.target).add(offset)
      controls.update()
      publishBounds(next)
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
      zoomSpeed={0.85}
      minDistance={PROJECT_BOOK_CAMERA.minDistance}
      maxDistance={PROJECT_BOOK_CAMERA.maxDistance}
      minPolarAngle={PROJECT_BOOK_CAMERA.minPolar}
      maxPolarAngle={PROJECT_BOOK_CAMERA.maxPolar}
      target={[
        PROJECT_BOOK_CAMERA.target.x,
        PROJECT_BOOK_CAMERA.target.y,
        PROJECT_BOOK_CAMERA.target.z,
      ]}
      enableRotate
      onStart={() => {
        setBookOrbiting(gesture.current, true)
        bumpActivity(PROJECT_BOOK_CAMERA.orbitSettleMs)
      }}
      onChange={() => {
        const controls = controlsRef.current
        if (controls) {
          publishBounds(currentDistance(camera, controls.target))
        }
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
