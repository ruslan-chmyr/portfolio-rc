import { createFluidRenderer, type LiquidDiagnostics, type LiquidRenderer } from '../../shared/graphics/fluid'
import { RC_MASK_PATHS } from './monogramDesign'

export type { LiquidDiagnostics, LiquidRenderer }

/** @deprecated Use `createFluidRenderer` from `shared/graphics/fluid` with an explicit mask. */
export function createLiquidRenderer(canvas: HTMLCanvasElement): LiquidRenderer | null {
  return createFluidRenderer(canvas, { maskPaths: RC_MASK_PATHS })
}
