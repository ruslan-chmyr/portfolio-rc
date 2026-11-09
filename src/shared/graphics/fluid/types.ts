export type Vec2 = { x: number; y: number }

export type RenderTarget = {
  texture: WebGLTexture
  framebuffer: WebGLFramebuffer
}

export type DoubleBuffer = {
  read: RenderTarget
  write: RenderTarget
  swap(): void
}

export type LiquidDiagnostics = {
  splatRan: boolean
  active: boolean
  interact: number
  movementMag: number
  velSample: number
  inkSample: number
}

export type InkColors = {
  ink: readonly [number, number, number]
  clear: readonly [number, number, number]
}

export interface LiquidRenderer {
  draw(
    strength: number,
    presence: number,
    proximity: number,
    pointer: Vec2,
    movement: Vec2,
    dt: number,
  ): void
  setInkColors(colors: InkColors): void
  getDiagnostics?: () => LiquidDiagnostics
  dispose(): void
}

export type FluidMaskSource = {
  maskPaths: readonly string[]
}
