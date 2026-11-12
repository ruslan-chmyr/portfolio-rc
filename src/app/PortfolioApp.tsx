import { IntroAnimation } from '../features/intro'
import { AboutSection } from '../features/about'
import { ContactSection } from '../features/contact'
import { ExperienceSection } from '../features/experience'
import { ProjectsSection } from '../features/projects'
import { SkillsSection } from '../features/skills'
import { TrailingCursor } from '../features/intro/components/TrailingCursor/TrailingCursor'
import { PortfolioNav } from './portfolio'
import './portfolio.css'

export function PortfolioApp() {
  return (
    <>
      <IntroAnimation />
      <PortfolioNav />
      <main className="portfolio-main" id="main-content">
        <AboutSection />
        <div className="skills-projects-stack">
          <SkillsSection />
          <ProjectsSection />
        </div>
        <ExperienceSection />
        <ContactSection />
      </main>
      <TrailingCursor />
    </>
  )
}
