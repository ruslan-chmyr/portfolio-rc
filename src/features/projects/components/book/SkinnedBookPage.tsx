import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import {
  Bone,
  Color,
  Group,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
} from 'three'
import { degToRad } from 'three/src/math/MathUtils.js'
import type { BookSheet } from '../../lib/buildBookSheets'
import {
  createSheetFaceTexture,
  releaseSheetFaceTexture,
  sheetFaceCacheKey,
} from '../../lib/sheetFaceTexture'
import {
  BOOK_PAGE_USERDATA_KEY,
  shouldSuppressPageClick,
} from '../../lib/bookGesture'
import { isBonePoseSettled } from '../../lib/bookPageSettle'
import {
  getSkinnedPageGeometry,
  SKINNED_PAGE,
} from '../../lib/skinnedPageGeometry'
import { PROJECT_BOOK_CAMERA } from '../../model/projectBookConfig'
import { useBookGesture } from './BookGestureContext'

type SkinnedBookPageProps = {
  sheet: BookSheet
  number: number
  page: number
  opened: boolean
  bookClosed: boolean
  sheetCount: number
  reducedMotion: boolean
  onSelect: (nextPage: number) => void
  onSettledChange?: (sheetIndex: number, settled: boolean) => void
}

const whiteColor = new Color('white')

const edgeMaterials = [
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: '#111111' }),
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: whiteColor }),
]

type BoneCoeffs = {
  inside: number
  outside: number
  turning: number
  fold: number
}

const BONE_COUNT = SKINNED_PAGE.PAGE_SEGMENTS + 1
const BONE_COEFFS: BoneCoeffs[] = Array.from({ length: BONE_COUNT }, (_, i) => ({
  inside: i < 8 ? Math.sin(i * 0.2 + 0.25) : 0,
  outside: i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0,
  turning: Math.sin(i * Math.PI * (1 / BONE_COUNT)),
  fold: i > 8 ? Math.sin(i * Math.PI * (1 / BONE_COUNT) - 0.5) : 0,
}))

/**
 * One physical sheet — SkinnedMesh bone chain from the reference book slider.
 * https://github.com/pakagronglb/animated-book-slider-threejs (MIT)
 */
export function SkinnedBookPage({
  sheet,
  number,
  page,
  opened,
  bookClosed,
  sheetCount,
  reducedMotion,
  onSelect,
  onSettledChange,
}: SkinnedBookPageProps) {
  const group = useRef<Group>(null)
  const skinnedMeshRef = useRef<SkinnedMesh>(null)
  const turnedAt = useRef(0)
  const lastOpened = useRef(opened)
  const lastBookClosed = useRef(bookClosed)
  const settledRef = useRef(false)
  const onSettledChangeRef = useRef(onSettledChange)
  const { gesture, bumpActivity } = useBookGesture()
  const bumpRef = useRef(bumpActivity)

  useEffect(() => {
    onSettledChangeRef.current = onSettledChange
  }, [onSettledChange])

  useEffect(() => {
    bumpRef.current = bumpActivity
  }, [bumpActivity])

  const frontKey = sheetFaceCacheKey(sheet.front)
  const backKey = sheetFaceCacheKey(sheet.back)

  // Pure mesh construction — no GPU texture retain during render.
  const manualSkinnedMesh = useMemo(() => {
    const bones: Bone[] = []
    for (let i = 0; i <= SKINNED_PAGE.PAGE_SEGMENTS; i += 1) {
      const bone = new Bone()
      bones.push(bone)
      bone.position.x = i === 0 ? 0 : SKINNED_PAGE.SEGMENT_WIDTH
      if (i > 0) bones[i - 1]!.add(bone)
    }
    const skeleton = new Skeleton(bones)
    const geometry = getSkinnedPageGeometry()
    const isCover = number === 0 || number === sheetCount - 1

    const materials = [
      ...edgeMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        roughness: isCover && number === 0 ? 0.72 : 0.18,
        metalness: isCover && number === 0 ? 0.12 : 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        roughness: isCover && number === sheetCount - 1 ? 0.72 : 0.18,
        metalness: 0,
      }),
    ]

    const mesh = new SkinnedMesh(geometry, materials)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.userData[BOOK_PAGE_USERDATA_KEY] = true
    mesh.add(skeleton.bones[0]!)
    mesh.bind(skeleton)
    return mesh
  }, [number, sheetCount])

  // Commit-phase texture ownership (Strict Mode safe).
  useLayoutEffect(() => {
    const materials = manualSkinnedMesh.material
    if (!Array.isArray(materials)) return
    const frontMat = materials[4]
    const backMat = materials[5]
    if (
      !(frontMat instanceof MeshStandardMaterial) ||
      !(backMat instanceof MeshStandardMaterial)
    ) {
      return
    }

    const onPaint = () => {
      bumpRef.current(280)
    }

    const frontMap = createSheetFaceTexture(sheet.front, onPaint)
    const backMap = createSheetFaceTexture(sheet.back, onPaint)
    frontMat.map = frontMap
    backMat.map = backMap
    frontMat.needsUpdate = true
    backMat.needsUpdate = true
    bumpRef.current(280)

    return () => {
      frontMat.map = null
      backMat.map = null
      frontMat.needsUpdate = true
      backMat.needsUpdate = true
      releaseSheetFaceTexture(frontKey, onPaint)
      releaseSheetFaceTexture(backKey, onPaint)
    }
  }, [manualSkinnedMesh, frontKey, backKey, sheet.front, sheet.back])

  useLayoutEffect(
    () => () => {
      const materials = manualSkinnedMesh.material
      const list = Array.isArray(materials) ? materials : [materials]
      for (const mat of list) {
        if (!(mat instanceof MeshStandardMaterial)) continue
        if (edgeMaterials.includes(mat)) continue
        mat.map = null
        mat.dispose()
      }
    },
    [manualSkinnedMesh],
  )

  const markSettled = (settled: boolean) => {
    if (settledRef.current === settled) return
    settledRef.current = settled
    onSettledChangeRef.current?.(number, settled)
  }

  useFrame((_, delta) => {
    const mesh = skinnedMeshRef.current
    const root = group.current
    if (!mesh || !root) return

    if (lastOpened.current !== opened) {
      turnedAt.current = Date.now()
      lastOpened.current = opened
      markSettled(false)
      bumpActivity(PROJECT_BOOK_CAMERA.pageSettleMs)
    }
    if (lastBookClosed.current !== bookClosed) {
      lastBookClosed.current = bookClosed
      markSettled(false)
      bumpActivity(PROJECT_BOOK_CAMERA.pageSettleMs)
    }

    const elapsed = Date.now() - turnedAt.current
    const turnProgress = Math.min(400, elapsed) / 400
    const turningTime = Math.sin(turnProgress * Math.PI)

    if (settledRef.current && turnProgress >= 1 && !reducedMotion) {
      return
    }

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8)
    }

    const bones = mesh.skeleton.bones
    const easeY = reducedMotion ? 0.0001 : SKINNED_PAGE.easingFactor
    const easeFold = reducedMotion ? 0.0001 : SKINNED_PAGE.easingFactorFold
    let allConverged = true

    for (let i = 0; i < bones.length; i += 1) {
      const target = i === 0 ? root : bones[i]!
      const coeff = BONE_COEFFS[i]!

      let rotationAngle =
        SKINNED_PAGE.insideCurveStrength * coeff.inside * targetRotation -
        SKINNED_PAGE.outsideCurveStrength * coeff.outside * targetRotation +
        SKINNED_PAGE.turningCurveStrength *
          coeff.turning *
          turningTime *
          targetRotation

      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2)

      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation
          foldRotationAngle = 0
        } else {
          rotationAngle = 0
          foldRotationAngle = 0
        }
      }

      const foldTarget = foldRotationAngle * coeff.fold * turningTime

      if (reducedMotion) {
        target.rotation.y = rotationAngle
        target.rotation.x = foldTarget
      } else {
        easing.dampAngle(target.rotation, 'y', rotationAngle, easeY, delta)
        easing.dampAngle(target.rotation, 'x', foldTarget, easeFold, delta)
      }

      if (
        !isBonePoseSettled(
          target.rotation.y,
          rotationAngle,
          target.rotation.x,
          foldTarget,
        )
      ) {
        allConverged = false
      }
    }

    if (turnProgress >= 1 && (reducedMotion || allConverged)) {
      markSettled(true)
    } else {
      markSettled(false)
      bumpActivity(180)
    }
  })

  return (
    <group
      ref={group}
      userData={{ [BOOK_PAGE_USERDATA_KEY]: true }}
      onClick={(event) => {
        event.stopPropagation()
        if (shouldSuppressPageClick(gesture.current)) return
        onSelect(opened ? number : number + 1)
        bumpActivity(PROJECT_BOOK_CAMERA.pageSettleMs)
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * SKINNED_PAGE.PAGE_DEPTH + page * SKINNED_PAGE.PAGE_DEPTH}
      />
    </group>
  )
}
