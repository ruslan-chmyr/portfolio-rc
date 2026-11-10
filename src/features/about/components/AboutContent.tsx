import type { RefObject } from 'react'
import { AboutPortrait } from './AboutPortrait'

type AboutContentProps = {
  contentRef: RefObject<HTMLElement | null>
}

export function AboutContent({ contentRef }: AboutContentProps) {
  return (
    <article ref={contentRef as RefObject<HTMLElement>} className="about-content">
      <div className="about-content__profile about-content__reveal">
        <AboutPortrait />
        <div className="about-content__copy">
          <h1 id="about-heading" className="about-content__name">
            Hi, I&apos;m Ruslan{' '}
            <span className="about-content__wave" aria-hidden>
              👋
            </span>
          </h1>
          <p className="about-content__intro">
            I&apos;m a Senior Frontend Engineer with 7+ years of commercial experience, passionate
            about solving challenging problems and turning complex ideas into intuitive, user-friendly
            interfaces.
          </p>
          <p className="about-content__intro about-content__intro--detail">
            My work focuses on building complex, data-heavy applications with React, Next.js and
            TypeScript, with an emphasis on frontend architecture, performance, and maintainability.
          </p>
          <p className="about-content__expertise about-content__expertise--primary">
            Frontend Architecture · AI Automation · Performance &amp; System Design
          </p>
          <p className="about-content__expertise about-content__expertise--secondary">
            Admin Platforms / Back-Office Systems / Client-Facing Applications
          </p>
        </div>
      </div>
    </article>
  )
}
