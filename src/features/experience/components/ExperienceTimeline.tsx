import { useMemo, useRef, type ReactNode } from 'react'
import { useExperienceTimeline } from '../hooks/useExperienceTimeline'
import { cardSideForIndex } from '../lib/experienceTimelineConfig'
import {
  EXPERIENCE_ENTRIES,
  type ExperienceEntry,
} from '../model/experienceConfig'
import { ExperienceCard } from './ExperienceCard'
import { ExperienceCvCta } from './ExperienceCvCta'

type ExperienceTimelineProps = {
  entries?: readonly ExperienceEntry[]
  /** Sticky left-column content (section header). */
  intro?: ReactNode
}

export function ExperienceTimeline({
  entries = EXPERIENCE_ENTRIES,
  intro,
}: ExperienceTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const yearRef = useRef<HTMLParagraphElement>(null)

  const timelineTargets = useMemo(
    () => ({
      trackRef,
      progressRef,
      yearRef,
      entries,
    }),
    [entries],
  )

  useExperienceTimeline(timelineTargets)

  return (
    <div className="experience-timeline">
      <aside className="experience-timeline__sidebar">
        {/*
          Sidebar stretches to the track height; intro pins through the
          scroll, CTA sits at the column end (under the final year).
        */}
        <div className="experience-timeline__sidebar-sticky">
          {intro}
          <div className="experience-timeline__year-rail" aria-hidden="true">
            <p ref={yearRef} className="experience-timeline__year">
              {entries[0]?.year ?? ''}
            </p>
          </div>
        </div>
        <ExperienceCvCta />
      </aside>

      <div ref={trackRef} className="experience-timeline__track">
        <div className="experience-timeline__line" aria-hidden="true">
          <div ref={progressRef} className="experience-timeline__progress" />
        </div>

        <ol className="experience-timeline__list">
          {entries.map((entry, index) => {
            // Markup always alternates; CSS collapses to a single column on mobile.
            const side = cardSideForIndex(index, 'alternating')
            return (
              <li
                key={entry.id}
                className={`experience-timeline__item experience-timeline__item--${side}`}
              >
                <span
                  className="experience-timeline__node"
                  data-experience-node
                  aria-hidden="true"
                />
                <ExperienceCard entry={entry} index={index} layout="alternating" />
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
