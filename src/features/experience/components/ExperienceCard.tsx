import type { ExperienceEntry } from '../model/experienceConfig'
import { cardSideForIndex, type ExperienceTimelineLayout } from '../lib/experienceTimelineConfig'

type ExperienceCardProps = {
  entry: ExperienceEntry
  index: number
  layout: ExperienceTimelineLayout
}

export function ExperienceCard({ entry, index, layout }: ExperienceCardProps) {
  const side = cardSideForIndex(index, layout)

  return (
    <article
      className={`experience-card experience-card--${side}`}
      data-experience-card
      data-experience-id={entry.id}
    >
      <p className="experience-card__period">
        <time dateTime={entry.dateTime}>{entry.period}</time>
      </p>
      <h3 className="experience-card__role">{entry.role}</h3>
      <p className="experience-card__org">{entry.organization}</p>
      <p className="experience-card__summary">{entry.summary}</p>
      {entry.tags && entry.tags.length > 0 ? (
        <ul className="experience-card__tags" aria-label="Technologies">
          {entry.tags.map((tag) => (
            <li key={tag} className="experience-card__tag">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
