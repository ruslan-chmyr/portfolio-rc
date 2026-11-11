import { EXPERIENCE_ENTRIES } from '../model/experienceConfig'
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
          <header className="experience-section__header">
            <h2 id="experience-heading" className="experience-section__title">
              Experience
            </h2>
            <p className="experience-section__lede">
              A straight scroll through roles, teams, and the kind of frontend
              work I keep coming back to.
            </p>
          </header>

          <ol className="experience-section__list">
            {EXPERIENCE_ENTRIES.map((entry) => (
              <li key={entry.period} className="experience-section__item">
                <p className="experience-section__period">{entry.period}</p>
                <div className="experience-section__body">
                  <h3 className="experience-section__role">{entry.role}</h3>
                  <p className="experience-section__place">{entry.place}</p>
                  <p className="experience-section__summary">{entry.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
