export const FLUID_RESOLUTION = {
  displayW: 1200,
  displayH: 640,
  velocityW: 256,
  velocityH: 136,
  dyeW: 768,
  dyeH: 408,
} as const

export const FLUID_SIM = {
  pressureIterations: 20,
  velocityDecay: 3.2,
  velocityDiffuseMix: 0.46,
  postSplatDiffuseMix: 0.5,
  velocityCap: 34,
  inkAdvectionGain: 2.2,
  inkDisplacementCapTexels: 3.2,
  macCormackCorrection: 0.22,
  macCormackCorrectionClamp: 0.035,
  macCormackBlend: 0.88,
  inkLossBase: 0.03,
  inkLossIdleBoost: 0.06,
  vorticityForce: 0.011,
  residualActiveSeconds: 1.25,
  restoreRateInjecting: 1.06,
  restoreRateIdle: 2.75,
  idleRecoveryTau: 3.2,
  seedRelaxSteps: [
    { step: 3, interact: 0, rate: 2.4 },
    { step: 2, interact: 0, rate: 2.4 },
  ],
  maxTimestep: 1 / 30,
  substepsThreshold: 1 / 90,
} as const
