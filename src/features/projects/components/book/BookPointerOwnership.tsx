import { useEffect, useRef, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { Raycaster, Vector2, type Object3D } from 'three'
import {
  beginBookPointer,
  BOOK_PAGE_USERDATA_KEY,
  endBookPointer,
  moveBookPointer,
  type BookGestureOwner,
} from '../../lib/bookGesture'
import { useBookGesture } from './BookGestureContext'

type BookPointerOwnershipProps = {
  /** Root that contains interactive page meshes. */
  bookRootRef: RefObject<Object3D | null>
}

function isBookPageObject(object: Object3D): boolean {
  let current: Object3D | null = object
  while (current) {
    if (current.userData?.[BOOK_PAGE_USERDATA_KEY] === true) return true
    current = current.parent
  }
  return false
}

/**
 * Pointer ownership for click-vs-drag:
 * - Down on a page → tentatively book (click turns the page).
 * - Drag past threshold → promote to orbit (OrbitControls stays enabled).
 * - Down on empty scene → orbit from the start (no page turn).
 *
 * OrbitControls remains enabled so click-and-hold on a page can rotate 360°.
 */
export function BookPointerOwnership({
  bookRootRef,
}: BookPointerOwnershipProps) {
  const { gesture } = useBookGesture()
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const raycaster = useRef(new Raycaster())
  const pointer = useRef(new Vector2())

  useEffect(() => {
    const el = gl.domElement

    const hitBook = (clientX: number, clientY: number): boolean => {
      const root = bookRootRef.current
      if (!root) return false
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return false
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.current.setFromCamera(pointer.current, camera)
      const hits = raycaster.current.intersectObject(root, true)
      return hits.some((hit) => isBookPageObject(hit.object))
    }

    const onDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      const owner: BookGestureOwner = hitBook(event.clientX, event.clientY)
        ? 'book'
        : 'orbit'

      beginBookPointer(
        gesture.current,
        event.clientX,
        event.clientY,
        owner,
        event.pointerId,
      )
    }

    const onMove = (event: PointerEvent) => {
      const state = gesture.current
      if (!state.pointerDown) return
      if (state.pointerId !== null && event.pointerId !== state.pointerId) return
      moveBookPointer(state, event.clientX, event.clientY)
    }

    const onUp = (event: PointerEvent) => {
      const state = gesture.current
      if (!state.pointerDown) return
      if (state.pointerId !== null && event.pointerId !== state.pointerId) return
      endBookPointer(state)
    }

    el.addEventListener('pointerdown', onDown, { capture: true })
    el.addEventListener('pointermove', onMove, { capture: true })
    el.addEventListener('pointerup', onUp, { capture: true })
    el.addEventListener('pointercancel', onUp, { capture: true })
    el.addEventListener('lostpointercapture', onUp, { capture: true })

    return () => {
      el.removeEventListener('pointerdown', onDown, { capture: true })
      el.removeEventListener('pointermove', onMove, { capture: true })
      el.removeEventListener('pointerup', onUp, { capture: true })
      el.removeEventListener('pointercancel', onUp, { capture: true })
      el.removeEventListener('lostpointercapture', onUp, { capture: true })
    }
  }, [bookRootRef, camera, gesture, gl, size.height, size.width])

  return null
}
