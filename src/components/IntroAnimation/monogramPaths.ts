import { parseCubicPath, radialExpand } from './pathMorph'

/** Unified RC ligature — M + 12 cubic segments per keyframe. */
const cubics = {
  rest: `
    M 56 264
    C 56 200 56 120 56 48
    C 96 48 152 48 204 48
    C 252 48 276 88 260 128
    C 244 168 208 180 172 180
    C 216 220 264 256 316 264
    C 400 264 472 244 508 192
    C 544 140 544 84 504 52
    C 448 24 376 24 320 48
    C 264 72 244 120 260 160
    C 276 200 318 224 368 228
    C 308 212 236 192 172 176
    C 128 160 128 160 128 120
    C 128 80 96 264 56 264
  `,
  flowA: `
    M 56 264
    C 56 200 56 120 56 48
    C 96 48 152 48 204 48
    C 252 48 282 84 268 124
    C 254 164 218 184 180 184
    C 224 222 276 256 330 264
    C 414 266 488 246 520 196
    C 548 148 542 92 498 60
    C 442 30 372 30 318 54
    C 262 78 240 120 258 158
    C 278 198 324 222 378 226
    C 318 210 244 190 176 172
    C 128 156 128 156 128 120
    C 128 80 96 264 56 264
  `,
  merge: `
    M 56 264
    C 56 200 56 120 56 48
    C 96 48 152 48 204 48
    C 252 48 276 88 260 128
    C 248 168 236 192 268 192
    C 294 206 322 218 352 224
    C 404 232 452 218 482 184
    C 512 150 504 106 464 82
    C 418 56 356 56 318 80
    C 276 104 264 142 280 176
    C 298 210 340 228 388 224
    C 330 214 258 200 198 184
    C 148 168 128 168 128 124
    C 128 80 96 264 56 264
  `,
  flowB: `
    M 56 272
    C 56 204 56 108 56 40
    C 96 40 152 40 204 40
    C 252 40 280 82 262 124
    C 244 168 206 186 168 186
    C 212 232 264 268 320 276
    C 408 278 486 254 522 198
    C 552 142 548 78 500 44
    C 444 12 372 12 314 40
    C 256 68 234 116 252 162
    C 272 208 320 234 374 238
    C 312 220 238 200 170 180
    C 124 164 124 164 124 116
    C 124 72 96 272 56 272
  `,
  settle: `
    M 56 264
    C 56 200 56 120 56 48
    C 96 48 152 48 204 48
    C 252 48 276 88 260 128
    C 244 168 208 180 172 180
    C 216 220 264 256 316 264
    C 400 264 472 244 508 192
    C 544 140 544 84 504 52
    C 448 24 376 24 320 48
    C 264 72 244 120 260 160
    C 276 200 318 224 368 228
    C 308 212 236 192 172 176
    C 128 160 128 160 128 120
    C 128 80 96 264 56 264
  `,
} as const

const CENTER_X = 310
const CENTER_Y = 156

const settle = parseCubicPath(cubics.settle)

export const MONOGRAM_KEYFRAMES = {
  rest: parseCubicPath(cubics.rest),
  flowA: parseCubicPath(cubics.flowA),
  merge: parseCubicPath(cubics.merge),
  flowB: parseCubicPath(cubics.flowB),
  settle,
  expand: radialExpand(settle, CENTER_X, CENTER_Y, 1.45),
} as const

export const MONOGRAM_VIEWBOX = { width: 600, height: 320 } as const
export const MONOGRAM_CENTER = { x: CENTER_X, y: CENTER_Y } as const

/** Master timeline tuning knobs */
export const INTRO_TIMING = {
  morphFlowA: 1.05,
  morphMerge: 0.95,
  morphFlowB: 1,
  morphSettle: 0.85,
  holdBeforeExpand: 0.35,
  morphExpand: 1.3,
  expandScale: 1.2,
} as const
