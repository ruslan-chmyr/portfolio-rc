import { IntroAnimation } from '../features/intro'
import { AboutSection } from '../features/about'
import { ExperienceSection } from '../features/experience'
import { ProjectsSection } from '../features/projects'
import { SkillsSection } from '../features/skills'
import { TrailingCursor } from '../features/intro/components/TrailingCursor/TrailingCursor'
import './portfolio.css'

export function PortfolioApp() {
  return (
    <>
      <IntroAnimation />
      <main className="portfolio-main" id="main-content">
        <AboutSection />
        <div className="skills-projects-stack">
          <SkillsSection />
          <ProjectsSection />
        </div>
        <ExperienceSection />
      </main>
      <TrailingCursor />
    </>
  )
}
