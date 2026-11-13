import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three'
import {
  closedCamera,
  closedPose,
  easeInOutCubic,
  lerp,
  lerpCamera,
  lerpPose,
  openCamera,
  openPose,
  type BookPose,
} from '../../lib/bookMotion'
import type { ProjectBookMachineState } from '../../lib/bookStateMachine'
import {
  createCoverCanvas,
  createProjectDetailPageCanvas,
  createProjectVisualPageCanvas,
} from '../../lib/createBookPageTexture'
import {
  applyPageCurl,
  applyPageCurlRest,
  createPageCurlRest,
  type PageCurlRest,
} from '../../lib/pageCurl'
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
  onRequestDetails?: () => void
}

type MotionState = {
  open: number
  flip: number
  hover: number
}

function useCanvasTexture(
  factory: (onPaint: () => void) => HTMLCanvasElement,
  deps: unknown[],
) {
  const invalidate = useThree((s) => s.invalidate)
  const texture = useMemo(() => {
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

function BookCameraRig({
  openAmount,
}: {
  openAmount: MutableRefObject<number>
}) {
  const { camera, invalidate } = useThree()

  useEffect(() => {
    const pose = closedCamera()
    camera.position.set(pose.x, pose.y, pose.z)
    camera.lookAt(0, 0.02, 0)
    invalidate()
  }, [camera, invalidate])

  useFrame(() => {
    const t = easeInOutCubic(openAmount.current)
    const pose = lerpCamera(closedCamera(), openCamera(), t)
    camera.position.set(pose.x, pose.y, pose.z)
    camera.lookAt(0, 0.02, 0)
  })

  return null
}

export function ProjectBook({
  entries,
  state,
  reducedMotion,
  onOpen,
  onTurnNext,
  onTurnPrev,
  onRequestDetails,
}: ProjectBookProps) {
  const rootRef = useRef<Group>(null)
  const coverRef = useRef<Group>(null)
  const spreadsRef = useRef<Group>(null)
  const flipRef = useRef<Mesh>(null)
  const flipGeoRef = useRef<PlaneGeometry | null>(null)
  const restRef = useRef<PageCurlRest | null>(null)
  const initialOpen = state.phase === 'closed' ? 0 : 1
  const motion = useRef<MotionState>({
    open: initialOpen,
    flip: 0,
    hover: 0,
  })
  const openAmount = useRef(initialOpen)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const hovered = useRef(false)
  const invalidate = useThree((s) => s.invalidate)

  const {
    pageWidth,
    pageHeight,
    pageSegments,
    coverThickness,
    paperBlockDepth,
    spineWidth,
    coverInset,
    coverOpenAngle,
    openDurationMs,
    flipDurationMs,
  } = PROJECT_BOOK_SCENE

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
    [active?.id, active?.coverImage],
  )

  const rightMap = useCanvasTexture(
    () =>
      active
        ? createProjectDetailPageCanvas(active)
        : createCoverCanvas({
            title: PROJECT_BOOK_META.coverTitle,
            years: PROJECT_BOOK_META.years,
          }),
    [active?.id, active?.title, active?.summary, active?.role, active?.technologies],
  )

  const flipMap = useCanvasTexture(
    (onPaint) => {
      if (state.turnDirection < 0 && active) {
        return createProjectVisualPageCanvas(active, onPaint)
      }
      return active
        ? createProjectDetailPageCanvas(active)
        : createCoverCanvas({
            title: PROJECT_BOOK_META.coverTitle,
            years: PROJECT_BOOK_META.years,
          })
    },
    [state.turnDirection, active?.id, nextEntry?.id, state.phase],
  )

  useLayoutEffect(() => {
    const rest = createPageCurlRest(pageWidth, pageHeight, pageSegments)
    const geo = new PlaneGeometry(
      pageWidth,
      pageHeight,
      pageSegments,
      pageSegments,
    )
    applyPageCurlRest(geo, rest)
    restRef.current = rest
    flipGeoRef.current = geo
    if (flipRef.current) flipRef.current.geometry = geo
    return () => {
      geo.dispose()
      flipGeoRef.current = null
      restRef.current = null
    }
  }, [pageWidth, pageHeight, pageSegments])

  useEffect(() => {
    tweenRef.current?.kill()
    const durationOpen = reducedMotion ? 0.001 : openDurationMs / 1000
    const durationFlip = reducedMotion ? 0.001 : flipDurationMs / 1000

    if (state.phase === 'opening') {
      tweenRef.current = gsap.to(motion.current, {
        open: 1,
        duration: durationOpen,
        ease: 'power3.inOut',
        onUpdate: () => {
          openAmount.current = motion.current.open
          invalidate()
        },
        onComplete: () => {
          motion.current.open = 1
          openAmount.current = 1
          invalidate()
        },
      })
    } else if (state.phase === 'closing') {
      tweenRef.current = gsap.to(motion.current, {
        open: 0,
        duration: durationOpen,
        ease: 'power3.inOut',
        onUpdate: () => {
          openAmount.current = motion.current.open
          invalidate()
        },
        onComplete: () => {
          motion.current.open = 0
          openAmount.current = 0
          invalidate()
        },
      })
    } else if (state.phase === 'turning') {
      motion.current.flip = 0
      tweenRef.current = gsap.to(motion.current, {
        flip: 1,
        duration: durationFlip,
        ease: 'power2.inOut',
        onUpdate: () => invalidate(),
        onComplete: () => {
          motion.current.flip = 0
          const geo = flipGeoRef.current
          const rest = restRef.current
          if (geo && rest) applyPageCurlRest(geo, rest)
          invalidate()
        },
      })
    } else if (state.phase === 'open') {
      motion.current.open = 1
      openAmount.current = 1
      motion.current.flip = 0
      const geo = flipGeoRef.current
      const rest = restRef.current
      if (geo && rest) applyPageCurlRest(geo, rest)
      invalidate()
    } else if (state.phase === 'closed') {
      motion.current.open = 0
      openAmount.current = 0
      invalidate()
    }

    return () => {
      tweenRef.current?.kill()
    }
  }, [state.phase, reducedMotion, openDurationMs, flipDurationMs, invalidate])

  useFrame((_, delta) => {
    const root = rootRef.current
    const cover = coverRef.current
    const spreads = spreadsRef.current
    if (!root || !cover) return

    const hoverTarget =
      hovered.current && state.phase === 'closed' && !reducedMotion ? 1 : 0
    const prevHover = motion.current.hover
    motion.current.hover +=
      (hoverTarget - motion.current.hover) * Math.min(1, delta * 8)
    if (
      Math.abs(motion.current.hover - prevHover) > 0.001 ||
      Math.abs(hoverTarget - motion.current.hover) > 0.001
    ) {
      invalidate()
    }

    const o = easeInOutCubic(motion.current.open)
    const h = motion.current.hover
    const pose: BookPose = lerpPose(closedPose(), openPose(), o)

    // Closed block is on +x from the spine — shift so the volume stays centered.
    root.position.x = lerp(-pageWidth * 0.5, 0, o)
    root.position.y = pose.posY + h * 0.035
    root.rotation.set(pose.rotX - h * 0.035, pose.rotY, pose.rotZ)
    root.scale.setScalar(1 + h * 0.018)

    cover.rotation.y = -o * coverOpenAngle

    if (spreads) {
      const show = motion.current.open > 0.18
      spreads.visible = show
      const opacity = Math.min(
        1,
        Math.max(0, (motion.current.open - 0.18) / 0.22),
      )
      spreads.traverse((child) => {
        if (!(child instanceof Mesh)) return
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material]
        for (const mat of mats) {
          if (mat && 'opacity' in mat) {
            mat.transparent = opacity < 0.999
            mat.opacity = opacity
          }
        }
      })
    }

    const geo = flipGeoRef.current
    const rest = restRef.current
    const flipping = state.phase === 'turning'
    if (flipping && geo && rest && flipRef.current) {
      const dir: 1 | -1 = state.turnDirection < 0 ? -1 : 1
      applyPageCurl(geo, rest, motion.current.flip, dir)
      flipRef.current.visible = true
    } else if (flipRef.current) {
      flipRef.current.visible = false
    }
  })

  const coverFaceMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: coverMap,
        roughness: 0.58,
        metalness: 0.24,
      }),
    [coverMap],
  )
  const leftMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: leftMap,
        roughness: 0.9,
        metalness: 0,
      }),
    [leftMap],
  )
  const rightMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: rightMap,
        roughness: 0.9,
        metalness: 0,
      }),
    [rightMap],
  )
  const flipMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: flipMap,
        roughness: 0.9,
        metalness: 0,
        side: DoubleSide,
      }),
    [flipMap],
  )

  useEffect(
    () => () => {
      coverFaceMat.dispose()
      leftMat.dispose()
      rightMat.dispose()
      flipMat.dispose()
    },
    [coverFaceMat, leftMat, rightMat, flipMat],
  )

  const closedDepth = coverThickness * 2 + paperBlockDepth
  const paperW = pageWidth - coverInset
  const paperH = pageHeight - coverInset * 2

  return (
    <>
      <BookCameraRig openAmount={openAmount} />
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
          if (
            onRequestDetails &&
            event.point.x > pageWidth * 0.12 &&
            event.point.y < -pageHeight * 0.3
          ) {
            onRequestDetails()
            return
          }
          if (event.point.x >= 0) onTurnNext()
          else onTurnPrev()
        }}
      >
        {/* Back board — same XY footprint as the closed front cover */}
        <mesh
          castShadow
          receiveShadow
          position={[pageWidth / 2, 0, -closedDepth / 2 + coverThickness / 2]}
        >
          <boxGeometry args={[pageWidth, pageHeight, coverThickness]} />
          <meshStandardMaterial color="#1a1c20" roughness={0.74} metalness={0.12} />
        </mesh>

        {/* Paper block — visible thickness between boards */}
        <mesh
          castShadow
          receiveShadow
          position={[
            pageWidth / 2,
            0,
            -coverThickness / 2 - paperBlockDepth / 2,
          ]}
        >
          <boxGeometry args={[paperW, paperH, paperBlockDepth]} />
          <meshStandardMaterial color="#f2ede5" roughness={0.94} metalness={0} />
        </mesh>

        {/* Spine strip */}
        <mesh castShadow position={[spineWidth * 0.35, 0, -closedDepth / 2]}>
          <boxGeometry
            args={[spineWidth, pageHeight + 0.006, closedDepth + 0.002]}
          />
          <meshStandardMaterial color="#121417" roughness={0.7} metalness={0.16} />
        </mesh>

        {/* Front hardcover — hinge at spine x=0 */}
        <group ref={coverRef} position={[0, 0, 0.002]}>
          <mesh
            castShadow
            receiveShadow
            position={[pageWidth / 2, 0, coverThickness / 2]}
          >
            <boxGeometry args={[pageWidth, pageHeight, coverThickness]} />
            <meshStandardMaterial color="#1a1c20" roughness={0.74} metalness={0.12} />
          </mesh>
          <mesh
            castShadow
            position={[pageWidth / 2, 0, coverThickness + 0.001]}
          >
            <planeGeometry args={[pageWidth - 0.01, pageHeight - 0.01]} />
            <primitive object={coverFaceMat} attach="material" />
          </mesh>
          <mesh position={[pageWidth / 2, 0, -0.001]}>
            <planeGeometry args={[pageWidth - 0.02, pageHeight - 0.02]} />
            <meshStandardMaterial color="#ebe4da" roughness={0.92} metalness={0} />
          </mesh>
        </group>

        {/* Interior spread */}
        <group ref={spreadsRef} visible={false}>
          <mesh
            castShadow
            position={[-pageWidth / 2 - 0.003, 0, 0.006]}
            rotation={[0, 0.01, 0]}
          >
            <planeGeometry args={[pageWidth, pageHeight]} />
            <primitive object={leftMat} attach="material" />
          </mesh>
          <mesh
            castShadow
            position={[pageWidth / 2 + 0.003, 0, 0.006]}
            rotation={[0, -0.01, 0]}
          >
            <planeGeometry args={[pageWidth, pageHeight]} />
            <primitive object={rightMat} attach="material" />
          </mesh>
        </group>

        <mesh ref={flipRef} position={[0, 0, 0.014]} visible={false} castShadow>
          <primitive object={flipMat} attach="material" />
        </mesh>
      </group>
    </>
  )
}
