export type ResourceManager = {
  track: (dispose: () => void) => void
  disposeAll: () => void
}

export type GpuRenderTarget = {
  texture: WebGLTexture
  framebuffer: WebGLFramebuffer
}

export type GpuDoubleBuffer = {
  read: GpuRenderTarget
  write: GpuRenderTarget
  swap: () => void
}

export type Texture2DParams = {
  width?: number
  height?: number
  internalFormat: number
  type: number
  source?: TexImageSource | null
  allocateStorage?: boolean
  minFilter?: number
  magFilter?: number
  wrapS?: number
  wrapT?: number
}
