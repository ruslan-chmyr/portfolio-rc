import { isProjectsSceneActive } from '../../../shared/scene/portfolioScene'
import type { PortfolioSectionId } from './portfolioSections'

const ROOT_NATIVE_SCROLL = 'portfolio-native-scroll'

export type DetectActivePortfolioSectionInput = {
  nativeScroll?: boolean
  projectsSceneActive?: boolean
  skillsHandoffPhase?: string | null
  /** Sorted by document order; tops are getBoundingClientRect().top */
  sectionTops?: Partial<Record<Exclude<PortfolioSectionId, 'intro'>, number>>
  viewportHeight?: number
}

function readSkillsHandoffPhase(): string | null {
  const skills = document.getElementById('expertise')
  return skills?.dataset.skillsHandoff ?? null
}

function readSectionTop(id: string): number | null {
  const el = document.getElementById(id)
  if (!el) return null
  return el.getBoundingClientRect().top
}

/**
 * Priority-based active section. Scene ownership beats raw geometry for
 * pinned Skills/Projects; avoids scrollY percentage ranges.
 */
export function detectActivePortfolioSection(
  input: DetectActivePortfolioSectionInput = {},
): PortfolioSectionId {
  const nativeScroll =
    input.nativeScroll ??
    (typeof document !== 'undefined' &&
      document.documentElement.classList.contains(ROOT_NATIVE_SCROLL))

  if (!nativeScroll) return 'intro'

  const projectsActive =
    input.projectsSceneActive ??
    (typeof document !== 'undefined' && isProjectsSceneActive())

  if (projectsActive) return 'projects'

  const handoff =
    input.skillsHandoffPhase ??
    (typeof document !== 'undefined' ? readSkillsHandoffPhase() : null)

  // Immersive chrome as soon as Skills alignment owns the gesture.
  if (handoff === 'settled' || handoff === 'aligning-skills') {
    return 'expertise'
  }

  const viewportHeight =
    input.viewportHeight ??
    (typeof window !== 'undefined' ? window.innerHeight : 800)
  const probe = viewportHeight * 0.35

  const tops =
    input.sectionTops ??
    ({
      about: readSectionTop('about') ?? readSectionTop('about-heading') ?? 0,
      expertise: readSectionTop('expertise') ?? Number.POSITIVE_INFINITY,
      projects: readSectionTop('projects') ?? Number.POSITIVE_INFINITY,
      experience: readSectionTop('experience') ?? Number.POSITIVE_INFINITY,
      contact: readSectionTop('contact') ?? Number.POSITIVE_INFINITY,
    } satisfies Partial<
      Record<Exclude<PortfolioSectionId, 'intro'>, number>
    >)

  const order: Exclude<PortfolioSectionId, 'intro'>[] = [
    'contact',
    'experience',
    'projects',
    'expertise',
    'about',
  ]

  for (const id of order) {
    const top = tops[id]
    if (top == null || !Number.isFinite(top)) continue
    if (top <= probe) return id
  }

  return 'about'
}
