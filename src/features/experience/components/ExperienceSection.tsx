import { PortfolioSectionIndex } from '../../../app/portfolio'
import '../../../app/portfolio/styles/portfolio-chrome.css'
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
        <div className="portfolio-section-index-rail portfolio-section-index-rail--low">
          <PortfolioSectionIndex activeId="experience" placement="leading" />
        </div>
        <div className="experience-section__inner">
          <ExperienceTimeline
            entries={EXPERIENCE_ENTRIES}
            intro={
              <header className="experience-section__header">
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
