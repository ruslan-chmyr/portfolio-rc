import { forwardRef } from 'react'
import { getSkill } from '../../model/skillsConfig'
import {
  storyCategoryLabel,
  type EngineeringStory,
} from '../../model/storiesConfig'

type StoryExpandedCardProps = {
  story: EngineeringStory
  indexLabel: string
  contentVisible: boolean
  onClose: () => void
}

function StorySection({ title, body }: { title: string; body?: string }) {
  if (!body?.trim()) return null
  return (
    <section className="skills-story-expanded__section">
      <h4 className="skills-story-expanded__section-title">{title}</h4>
      <p className="skills-story-expanded__section-body">{body}</p>
    </section>
  )
}

export const StoryExpandedCard = forwardRef<HTMLElement, StoryExpandedCardProps>(
  function StoryExpandedCard(
    { story, indexLabel, contentVisible, onClose },
    ref,
  ) {
    const categoryLabel = storyCategoryLabel(story.category)
    const related = story.relatedSkillIds
      .map((id) => getSkill(id))
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill))

    return (
      <article
        ref={ref}
        className="skills-story-expanded"
        style={{ backgroundImage: `url("${story.cover}")` }}
        aria-labelledby="skills-story-expanded-title"
      >
        <div className="skills-story-expanded__scrim" aria-hidden />
        <header className="skills-story-expanded__top">
          <p className="skills-story-expanded__eyebrow">
            Highlight {indexLabel} · {categoryLabel}
          </p>
          <button
            type="button"
            className="skills-story-expanded__close"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div
          className={[
            'skills-story-expanded__content',
            contentVisible ? 'skills-story-expanded__content--visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="skills-story-expanded__main">
            <h3
              id="skills-story-expanded-title"
              className="skills-story-expanded__title"
            >
              {story.title}
            </h3>
            <p className="skills-story-expanded__subtitle">{story.subtitle}</p>

            <div className="skills-story-expanded__body">
              <StorySection title="Challenge" body={story.challenge} />
              <StorySection title="Engineering Decision" body={story.approach} />
              <StorySection
                title="Implementation & Outcome"
                body={story.outcome}
              />
            </div>
          </div>

          {related.length > 0 ? (
            <footer className="skills-story-expanded__related">
              <h4 className="skills-story-expanded__section-title">
                Related skills
              </h4>
              <ul className="skills-story-expanded__skills">
                {related.map((skill) => (
                  <li key={skill.id}>{skill.name}</li>
                ))}
              </ul>
            </footer>
          ) : null}
        </div>
      </article>
    )
  },
)
