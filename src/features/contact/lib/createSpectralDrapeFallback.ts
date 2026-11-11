/**
 * Original WebGL particle-fabric backdrop for Contact.
 *
 * React Bits Pro “Spectral Drape” is license-gated and is NOT installed in this
 * repo. This module is an independent Three.js Points + shader implementation
 * that targets the same visual brief (folded luminous cloth, depth, slow flow)
 * using only project dependencies (`three`).
 */

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'
import {
  SPECTRAL_DRAPE,
  selectSpectralDrapeProfile,
  type SpectralDrapeProfile,
} from './spectralDrapeConfig'

export type SpectralDrapeFallback = {
  dispose: () => void
  setPaused: (paused: boolean) => void
}

type FabricOptions = {
  reducedMotion?: boolean
}

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uFlow;
uniform float uAmplitude;
uniform float uDepth;
uniform float uFrequency;
uniform float uThickness;
uniform float uZoom;
uniform float uSeed;
uniform vec2 uPointer;
uniform float uBrush;
uniform float uBrushRadius;
uniform float uParallax;
uniform float uPixelRatio;
uniform float uSoftPoint;

attribute vec2 aUv;

varying float vLift;
varying float vShade;
varying float vFresnel;

float strandField(vec2 uv, float seed, float t) {
  // Wide flowing ridge — thickness keeps most of the sheet lit as cloth.
  float path =
    0.5
    + 0.38 * sin(uv.y * 6.2831853 * uFrequency + t * uFlow + seed)
    + 0.16 * sin(uv.y * 11.0 + t * 0.62 + seed * 1.31)
    + 0.07 * cos(uv.y * 2.7 - t * 0.38 + seed * 0.6);
  float d = abs(uv.x - path);
  float width = max(uThickness * 0.38, 0.08);
  float ridge = exp(-pow(d / width, 2.0));

  float cross =
    0.5
    + 0.32 * cos(uv.x * 4.8 + t * 0.48 + seed * 0.85)
    + 0.1 * sin(uv.x * 8.6 - t * 0.33 + seed);
  float d2 = abs(uv.y - cross);
  float crossRidge = exp(-pow(d2 / max(uThickness * 0.42, 0.09), 2.0)) * 0.55;

  return (ridge + crossRidge) * (0.65 + 0.35 * sin(uv.y * 7.0 + t * 0.85 + seed));
}

float crestSize(float lift) {
  return 0.75 + smoothstep(-0.1, 1.0, lift) * 0.55;
}

void main() {
  float t = uTime * uSpeed;
  vec2 uv = aUv;

  // Base cloth undulation across the whole grid (not only strand crests).
  float cloth =
    sin(uv.x * 2.8 + t * 0.42) * cos(uv.y * 2.1 - t * 0.33) * 0.22
    + sin(uv.x * 5.4 - uv.y * 3.1 + t * 0.55) * 0.12
    + cos((uv.x + uv.y) * 3.6 - t * 0.28) * 0.08;
  cloth *= uAmplitude;

  float folds = 0.0;
  folds += strandField(uv, uSeed + 0.0, t);
  folds += strandField(uv, uSeed + 1.7, t) * 0.9;
  folds += strandField(uv, uSeed + 3.4, t) * 0.78;
  folds += strandField(uv, uSeed + 5.1, t) * 0.7;
  folds += strandField(uv, uSeed + 6.9, t) * 0.62;
  folds += strandField(uv, uSeed + 8.5, t) * 0.54;
  folds += strandField(uv, uSeed + 10.2, t) * 0.46;
  folds += strandField(uv, uSeed + 11.8, t) * 0.4;
  folds *= uDepth * 0.55;

  float lift = cloth + folds;

  float swing = sin(uv.y * 3.8 + t * uFlow * 0.75) * uAmplitude * 0.1 * (0.4 + lift);
  float drift = cos(uv.x * 3.2 - t * 0.48) * uAmplitude * 0.07 * (0.35 + lift);

  // Bias fabric slightly left / lower (Contact composition).
  vec3 pos = vec3(
    (uv.x - 0.4) * 2.7 * uZoom + swing,
    lift * 1.15 - 0.32,
    (uv.y - 0.38) * 3.05 * uZoom + drift
  );

  vec2 p = uPointer;
  float dist = distance(uv, p);
  float brush = uBrush * smoothstep(uBrushRadius, 0.0, dist);
  vec2 away = normalize(uv - p + 1e-5);
  pos.x += away.x * brush * 0.2;
  pos.z += away.y * brush * 0.16;
  pos.y += brush * 0.07;

  pos.x += (p.x - 0.65) * uParallax * 0.12;
  pos.y += (0.35 - p.y) * uParallax * 0.08;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float depthAtt = clamp(9.5 / max(-mv.z, 0.55), 0.35, 3.2);
  gl_PointSize = uSoftPoint * depthAtt * uPixelRatio * crestSize(lift);

  vLift = lift;
  vShade = clamp(0.35 + lift * 0.75 + (1.0 - uv.y) * 0.18 + uv.x * 0.12, 0.0, 1.6);
  vFresnel = clamp(1.15 + mv.z * 0.12, 0.35, 1.25);
}
`

const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uSoftness;
uniform float uIntensity;
uniform float uColorShift;

varying float vLift;
varying float vShade;
varying float vFresnel;

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r = length(c);
  float soft = mix(0.1, 0.48, clamp(uSoftness, 0.0, 1.0));
  float alpha = smoothstep(1.0, soft, r);
  if (alpha < 0.01) discard;

  float crest = smoothstep(-0.05, 0.95, vLift);
  vec3 col = mix(uColorA, uColorB, crest * (0.4 + uColorShift));
  col *= (0.62 + vShade * 0.55) * uIntensity * vFresnel;

  // Entire cloth stays visible; crests only brighten.
  float a = alpha * (0.42 + crest * 0.4 + vShade * 0.18);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}
`

function buildGeometry(cols: number, rows: number): BufferGeometry {
  const count = cols * rows
  const positions = new Float32Array(count * 3)
  const uvs = new Float32Array(count * 2)
  let i = 0
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const u = cols <= 1 ? 0.5 : col / (cols - 1)
      const v = rows <= 1 ? 0.5 : row / (rows - 1)
      const idx = i * 2
      uvs[idx] = u
      uvs[idx + 1] = v
      // Placeholder positions — shader rebuilds from aUv.
      positions[i * 3] = u
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = v
      i += 1
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aUv', new BufferAttribute(uvs, 2))
  return geometry
}

function createMaterial(
  profile: SpectralDrapeProfile,
  pixelRatio: number,
): ShaderMaterial {
  const colorA = new Color(SPECTRAL_DRAPE.colors[0])
  const colorB = new Color(SPECTRAL_DRAPE.colors[1])
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: profile.speed },
      uFlow: { value: SPECTRAL_DRAPE.flow },
      uAmplitude: { value: SPECTRAL_DRAPE.amplitude },
      uDepth: { value: SPECTRAL_DRAPE.depth },
      uFrequency: { value: SPECTRAL_DRAPE.frequency },
      uThickness: { value: SPECTRAL_DRAPE.thickness },
      uZoom: { value: SPECTRAL_DRAPE.zoom },
      uSeed: { value: SPECTRAL_DRAPE.seed },
      uPointer: { value: { x: 0.72, y: 0.32 } },
      uBrush: { value: profile.interactive ? SPECTRAL_DRAPE.brush : 0 },
      uBrushRadius: { value: SPECTRAL_DRAPE.brushRadius },
      uParallax: {
        value: profile.interactive ? SPECTRAL_DRAPE.parallax : 0,
      },
      uPixelRatio: { value: pixelRatio },
      uSoftPoint: { value: 2.45 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uSoftness: { value: SPECTRAL_DRAPE.softness },
      uIntensity: { value: SPECTRAL_DRAPE.intensity },
      uColorShift: { value: SPECTRAL_DRAPE.colorShift },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  })
}

export function createSpectralDrapeFallback(
  canvas: HTMLCanvasElement,
  options?: FabricOptions,
): SpectralDrapeFallback {
  const reducedMotion = Boolean(options?.reducedMotion)
  let disposed = false
  let paused = reducedMotion
  let raf = 0
  let lastTs = 0
  let time = 0

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(44, 1, 0.1, 40)
  camera.position.set(0.75, 1.05, 2.55)
  camera.lookAt(0.05, -0.15, 0)

  let geometry: BufferGeometry | null = null
  let material: ShaderMaterial | null = null
  let points: Points | null = null
  let profile: SpectralDrapeProfile = selectSpectralDrapeProfile({
    width: 1,
    height: 1,
    prefersReducedMotion: reducedMotion,
    viewportWidth: window.innerWidth,
  })

  const rebuild = () => {
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width))
    const height = Math.max(1, Math.floor(rect.height))
    profile = selectSpectralDrapeProfile({
      width,
      height,
      prefersReducedMotion: reducedMotion,
      viewportWidth: window.innerWidth,
    })

    const dpr = Math.min(window.devicePixelRatio || 1, profile.maxDpr)
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    if (points) {
      scene.remove(points)
      geometry?.dispose()
      material?.dispose()
      points = null
      geometry = null
      material = null
    }

    geometry = buildGeometry(profile.cols, profile.rows)
    material = createMaterial(profile, dpr)
    points = new Points(geometry, material)
    points.rotation.set(
      (SPECTRAL_DRAPE.tilt * Math.PI) / 180,
      (SPECTRAL_DRAPE.turn * Math.PI) / 180,
      (SPECTRAL_DRAPE.roll * Math.PI) / 180,
    )
    points.frustumCulled = false
    scene.add(points)

    // Seed a static frame for reduced-motion / first paint.
    material.uniforms.uTime!.value = reducedMotion ? 1.8 : time
    renderer.render(scene, camera)
  }

  const onPointer = (event: PointerEvent) => {
    if (disposed || !profile.interactive || !material) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    material.uniforms.uPointer!.value.x = (event.clientX - rect.left) / rect.width
    material.uniforms.uPointer!.value.y = (event.clientY - rect.top) / rect.height
  }

  const tick = (ts: number) => {
    if (disposed) return
    if (!paused && material) {
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016
      lastTs = ts
      time += dt
      material.uniforms.uTime!.value = time
      renderer.render(scene, camera)
      raf = window.requestAnimationFrame(tick)
    } else {
      lastTs = 0
    }
  }

  const start = () => {
    if (disposed || paused) return
    cancelAnimationFrame(raf)
    lastTs = 0
    raf = window.requestAnimationFrame(tick)
  }

  rebuild()
  window.addEventListener('resize', rebuild)
  window.addEventListener('pointermove', onPointer, { passive: true })
  if (!paused) start()

  return {
    setPaused: (next) => {
      if (disposed) return
      if (next === paused) return
      paused = next || reducedMotion
      if (paused) {
        cancelAnimationFrame(raf)
        lastTs = 0
        if (material) {
          material.uniforms.uTime!.value = time
          renderer.render(scene, camera)
        }
      } else {
        start()
      }
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', rebuild)
      window.removeEventListener('pointermove', onPointer)
      if (points) scene.remove(points)
      geometry?.dispose()
      material?.dispose()
      renderer.dispose()
      // Release GL context when the browser supports it.
      const gl = renderer.getContext()
      const lose = (
        gl as WebGLRenderingContext & {
          getExtension?: (name: string) => { loseContext?: () => void } | null
        }
      ).getExtension?.('WEBGL_lose_context')
      lose?.loseContext?.()
    },
  }
}
