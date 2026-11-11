import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['src/shared/lib/pointer/coordinates.test.ts', 'jsdom'],
      ['src/features/intro/lib/attachIntroTheme.test.ts', 'jsdom'],
      ['src/features/intro/lib/createIntroScrollHandoff.test.ts', 'jsdom'],
      ['src/features/skills/hooks/useSkillCategoryTransition.test.ts', 'jsdom'],
    ],
    include: ['src/**/*.test.ts'],
  },
})
