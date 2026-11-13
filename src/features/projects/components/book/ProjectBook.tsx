import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three'
import {
  applyPageBend,
  resetPagePlane,
} from '../../lib/pageBend'
import {
  createCoverCanvas,
  createProjectDetailPageCanvas,
  createProjectVisualPageCanvas,
} from '../../lib/createBookPageTexture'
import type { ProjectBookMachineState } from '../../lib/bookStateMachine'
import {
  PROJECT_BOOK_META,
  PROJECT_BOOK_SCENE,
} from '../../model/projectBookConfig'
import type { ProjectBookEntry } from '../../model/projectBookData'

type ProjectBookProps = {
  entries: readonly ProjectBookEntry[]
  state: ProjectBookMachineState
  reducedMotion: boolean
  onOpen: () => void
  onTurnNext: () => void
  onTurnPrev: () => void
}

function useCanvasTexture(
  factory: (onPaint: () => void) => HTMLCanvasElement,
  deps: unknown[],
) {
  const invalidate = useThree((s) => s.invalidate)
  const texture = useMemo(() => {
    // Logo/cover images may paint synchronously (cached) before CanvasTexture exists.
    let map: CanvasTexture | null = null
    const canvas = factory(() => {
      if (!map) return
      map.needsUpdate = true
      invalidate()
    })
    map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    map.anisotropy = 4
    map.needsUpdate = true
    return map
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- factory deps passed explicitly
  }, deps)

  useEffect(
    () => () => {
      texture.dispose()
    },
    [texture],
  )

  return texture
}

export function ProjectBook({
  entries,
  state,
  reducedMotion,
  onOpen,
  onTurnNext,
  onTurnPrev,
}: ProjectBookProps) {
  const rootRef = useRef<Group>(null)
  const coverRef = useRef<Group>(null)
  const flipRef = useRef<Mesh>(null)
  const flipGeoRef = useRef<PlaneGeometry | null>(null)
  const flipProgress = useRef(0)
  const targetFlip = useRef(0)
  const openProgress = useRef(state.phase === 'closed' ? 0 : 1)
  const hoverAmount = useRef(0)
  const hovered = useRef(false)
  const invalidate = useThree((s) => s.invalidate)

  const { pageWidth, pageHeight, pageSegments } = PROJECT_BOOK_SCENE
  const active = entries[state.spreadIndex] ?? entries[0]
  const nextEntry =
    entries[Math.min(state.spreadIndex + 1, entries.length - 1)] ?? active

  const coverMap = useCanvasTexture(
    (onPaint) =>
      createCoverCanvas(
        {
          title: PROJECT_BOOK_META.coverTitle,
          years: PROJECT_BOOK_META.years,
        },
        onPaint,
      ),
    [PROJECT_BOOK_META.coverTitle, PROJECT_BOOK_META.years],
  )

  const leftMap = useCanvasTexture(
    (onPaint) =>
      active
        ? createProjectVisualPageCanvas(active, onPaint)
        : createCoverCanvas(
            {
              title: PROJECT_BOOK_META.coverTitle,
              years: PROJECT_BOOK_META.years,
            },
            onPaint,
          ),
    [active?.id, active?.coverImage, active?.title],
  )

  const rightMap = useCanvasTexture(
    () =>
      active
        ? createProjectDetailPageCanvas(active)
        : createCoverCanvas({
            title: PROJECT_BOOK_META.coverTitle,
            years: PROJECT_BOOK_META.years,
          }),
    [
      active?.id,
      active?.title,
      active?.summary,
      active?.challenge,
      active?.solution,
      active?.results,
      active?.role,
    ],
  )

  const flipMap = useCanvasTexture(
    (onPaint) =>
      state.turnDirection < 0 && active
        ? createProjectDetailPageCanvas(active)
        : nextEntry
          ? createProjectVisualPageCanvas(nextEntry, onPaint)
          : createCoverCanvas(
              {
                title: PROJECT_BOOK_META.coverTitle,
                years: PROJECT_BOOK_META.years,
              },
              onPaint,
            ),
    [state.turnDirection, active?.id, nextEntry?.id, state.phase],
  )

  useLayoutEffect(() => {
    const geo = new PlaneGeometry(
      pageWidth,
      pageHeight,
      pageSegments,
      pageSegments,
    )
    resetPagePlane(geo, pageWidth, pageHeight, pageSegments)
    flipGeoRef.current = geo
    if (flipRef.current) flipRef.current.geometry = geo
    return () => {
      geo.dispose()
      flipGeoRef.current = null
    }
  }, [pageWidth, pageHeight, pageSegments])

  useEffect(() => {
    if (state.phase === 'opening' || state.phase === 'open') {
      targetFlip.current = 0
      if (reducedMotion) openProgress.current = 1
    }
    if (state.phase === 'closing' || state.phase === 'closed') {
      if (reducedMotion) openProgress.current = 0
    }
    if (state.phase === 'turning') {
      targetFlip.current = 1
      flipProgress.current = reducedMotion ? 1 : 0
    }
    if (state.phase === 'open') {
      flipProgress.current = 0
      targetFlip.current = 0
      const geo = flipGeoRef.current
      if (geo) resetPagePlane(geo, pageWidth, pageHeight, pageSegments)
    }
    invalidate()
  }, [state.phase, reducedMotion, pageWidth, pageHeight, pageSegments, invalidate])

  useFrame((_, delta) => {
    const root = rootRef.current
    const cover = coverRef.current
    const flip = flipRef.current
    if (!root || !cover) return

    const openTarget =
      state.phase === 'closed' || state.phase === 'closing' ? 0 : 1
    const openSpeed = reducedMotion ? 1 : 2.2
    openProgress.current +=
      (openTarget - openProgress.current) * Math.min(1, delta * openSpeed)

    const hoverTarget =
      hovered.current && state.phase === 'closed' && !reducedMotion ? 1 : 0
    hoverAmount.current +=
      (hoverTarget - hoverAmount.current) * Math.min(1, delta * 6)

    const o = openProgress.current
    const h = hoverAmount.current
    root.rotation.x = -0.42 + o * 0.3 - h * 0.04
    root.rotation.y = 0.55 - o * 0.55
    root.rotation.z = -0.08 + o * 0.08
    root.scale.setScalar(1 + h * 0.025)

    cover.rotation.y = -o * Math.PI * 0.92

    if (state.phase === 'closed' && !reducedMotion) {
      root.position.y =
        -0.05 + Math.sin(performance.now() * 0.0012) * 0.02 + h * 0.04
    } else {
      root.position.y = -0.05 + o * 0.08
    }

    if (state.phase === 'turning' && flip && flipGeoRef.current) {
      const speed = reducedMotion ? 1 : 2.6
      flipProgress.current +=
        (targetFlip.current - flipProgress.current) * Math.min(1, delta * speed)
      applyPageBend(flipGeoRef.current, flipProgress.current, pageWidth)
      flip.visible = true
    } else if (flip) {
      flip.visible = false
    }
  })

  const coverMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: coverMap,
        roughness: 0.55,
        metalness: 0.18,
      }),
    [coverMap],
  )
  const leftMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: leftMap,
        roughness: 0.85,
        metalness: 0.02,
      }),
    [leftMap],
  )
  const rightMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: rightMap,
        roughness: 0.85,
        metalness: 0.02,
      }),
    [rightMap],
  )
  const flipMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: flipMap,
        roughness: 0.85,
        metalness: 0.02,
        side: 2,
      }),
    [flipMap],
  )

  useEffect(
    () => () => {
      coverMat.dispose()
      leftMat.dispose()
      rightMat.dispose()
      flipMat.dispose()
    },
    [coverMat, leftMat, rightMat, flipMat],
  )

  return (
    <group
      ref={rootRef}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (state.phase !== 'closed') return
        hovered.current = true
        invalidate()
      }}
      onPointerOut={() => {
        hovered.current = false
        invalidate()
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (state.phase === 'closed') {
          onOpen()
          return
        }
        if (state.phase !== 'open') return
        if (event.point.x >= 0) onTurnNext()
        else onTurnPrev()
      }}
    >
      <mesh position={[-pageWidth * 0.02, 0, -0.03]} receiveShadow>
        <boxGeometry args={[pageWidth * 2.02, pageHeight * 1.02, 0.06]} />
        <meshStandardMaterial color="#14161a" roughness={0.7} metalness={0.12} />
      </mesh>

      <group ref={coverRef} position={[0, 0, 0.02]}>
        <mesh castShadow position={[pageWidth / 2, 0, 0]}>
          <planeGeometry args={[pageWidth, pageHeight]} />
          <primitive object={coverMat} attach="material" />
        </mesh>
      </group>

      <group visible={state.phase !== 'closed'}>
        <mesh position={[-pageWidth / 2 - 0.01, 0, 0.01]} castShadow>
          <planeGeometry args={[pageWidth, pageHeight]} />
          <primitive object={leftMat} attach="material" />
        </mesh>
        <mesh position={[pageWidth / 2 + 0.01, 0, 0.01]} castShadow>
          <planeGeometry args={[pageWidth, pageHeight]} />
          <primitive object={rightMat} attach="material" />
        </mesh>
      </group>

      <mesh
        ref={flipRef}
        position={[0, 0, 0.03]}
        visible={false}
        castShadow
      >
        <primitive object={flipMat} attach="material" />
      </mesh>

      {state.phase === 'closed' ? (
        <mesh position={[pageWidth * 0.35, 0, 0.08]} visible={false}>
          <boxGeometry args={[pageWidth * 1.1, pageHeight * 1.1, 0.2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ) : null}
    </group>
  )
}
