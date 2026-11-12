import { useMemo, useRef, type ReactNode } from 'react'
import { useExperienceTimeline } from '../hooks/useExperienceTimeline'
import { cardSideForIndex } from '../lib/experienceTimelineConfig'
import {
  EXPERIENCE_ENTRIES,
  type ExperienceEntry,
} from '../model/experienceConfig'
import { ExperienceCard } from './ExperienceCard'

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
        {/* Sidebar stretches with the track; intro + year pin as one stack. */}
        <div className="experience-timeline__sidebar-sticky">
          {intro}
          <div className="experience-timeline__year-rail" aria-hidden="true">
            <p ref={yearRef} className="experience-timeline__year">
              {entries[0]?.year ?? ''}
            </p>
          </div>
        </div>
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
          {/* Measured CV endpoint — line continues past the last career node. */}
          <li
            className="experience-timeline__item experience-timeline__item--endpoint"
            aria-hidden="true"
          >
            <span
              className="experience-timeline__node experience-timeline__node--endpoint"
              data-experience-node
              data-experience-endpoint-node
            />
          </li>
        </ol>
      </div>
    </div>
  )
}
