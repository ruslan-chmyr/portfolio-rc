import { IntroAnimation } from '../features/intro'
import { AboutSection } from '../features/about'
import { SkillsSection } from '../features/skills'
import { TrailingCursor } from '../features/intro/components/TrailingCursor/TrailingCursor'
import './portfolio.css'

export function PortfolioApp() {
  return (
    <>
      <IntroAnimation />
      <main className="portfolio-main" id="main-content">
        <AboutSection />
        <SkillsSection />
      </main>
      <TrailingCursor />
    </>
  )
}
