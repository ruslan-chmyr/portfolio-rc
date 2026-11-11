import { getSkill } from '../../model/skillsConfig'
import {
  storyCategoryLabel,
  type EngineeringStory,
} from '../../model/storiesConfig'

type StoryDetailProps = {
  story: EngineeringStory
  onClose: () => void
}

function StorySection({ title, body }: { title: string; body?: string }) {
  if (!body?.trim()) return null
  return (
    <section className="skills-story-detail__section">
      <h4 className="skills-story-detail__section-title">{title}</h4>
      <p className="skills-story-detail__section-body">{body}</p>
    </section>
  )
}

export function StoryDetail({ story, onClose }: StoryDetailProps) {
  const categoryLabel = storyCategoryLabel(story.category)
  const related = story.relatedSkillIds
    .map((id) => getSkill(id))
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill))

  return (
    <article
      className="skills-story-detail"
      aria-labelledby="skills-story-detail-title"
    >
      <header className="skills-story-detail__header">
        <div className="skills-story-detail__meta">
          <p className="skills-story-detail__eyebrow">Engineering Highlight</p>
          <p className="skills-story-detail__category">{categoryLabel}</p>
        </div>
        <button
          type="button"
          className="skills-story-detail__close"
          onClick={onClose}
        >
          Close
        </button>
      </header>

      <h3 id="skills-story-detail-title" className="skills-story-detail__title">
        {story.title}
      </h3>
      <p className="skills-story-detail__subtitle">{story.subtitle}</p>

      <div className="skills-story-detail__body">
        <StorySection title="Challenge" body={story.challenge} />
        <StorySection title="Engineering Decision" body={story.approach} />
        <StorySection
          title="Implementation & Outcome"
          body={story.outcome}
        />
      </div>

      {related.length > 0 ? (
        <footer className="skills-story-detail__related">
          <h4 className="skills-story-detail__section-title">Related skills</h4>
          <ul className="skills-story-detail__skills">
            {related.map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  )
}
