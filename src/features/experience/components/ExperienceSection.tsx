import { EXPERIENCE_ENTRIES } from '../model/experienceConfig'
import { ExperienceTimeline } from './ExperienceTimeline'
import '../styles/experience.css'

export function ExperienceSection() {
  return (
    <section
      id="experience"
      className="experience-section"
      aria-labelledby="experience-heading"
    >
      <div className="experience-section__motion">
        <div className="experience-section__inner">
          <ExperienceTimeline
            entries={EXPERIENCE_ENTRIES}
            intro={
              <header className="experience-section__header">
                <p className="experience-section__label">05 / Career</p>
                <h2 id="experience-heading" className="experience-section__title">
                  Experience
                </h2>
                <p className="experience-section__lede">
                  A journey through the products, teams, and challenges that
                  shaped my engineering approach.
                </p>
              </header>
            }
          />
        </div>
      </div>
    </section>
  )
}
