import { useRef } from 'react'
import { PortfolioSectionIndex } from '../../../app/portfolio'
import '../../../app/portfolio/styles/portfolio-chrome.css'
import { useContactEntrance } from '../hooks/useContactEntrance'
import { CONTACT_CONFIG } from '../model/contactConfig'
import { ContactBackground } from './ContactBackground'
import { ContactFooter } from './ContactFooter'
import { ContactForm } from './ContactForm'
import { ContactHeading } from './ContactHeading'
import { ContactLinks } from './ContactLinks'
import '../styles/contact.css'

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  useContactEntrance({
    sectionRef,
    introRef,
    linksRef,
    formRef,
    footerRef,
  })

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="contact-section"
      aria-labelledby="contact-heading"
    >
      <ContactBackground />

      <div className="portfolio-section-index-rail portfolio-section-index-rail--high">
        <PortfolioSectionIndex activeId="contact" placement="leading" />
      </div>

      <div className="contact-section__inner">
        <div className="contact-section__grid">
          <div className="contact-section__left">
            <div className="contact-section__intro" ref={introRef} data-contact-intro>
              <p className="contact-section__availability">
                <span className="contact-section__status-dot" aria-hidden="true" />
                {CONTACT_CONFIG.availability}
              </p>
              <ContactHeading />
              <p className="contact-section__lede">{CONTACT_CONFIG.description}</p>
            </div>
            <div ref={linksRef}>
              <ContactLinks />
            </div>
          </div>

          <div ref={formRef}>
            <ContactForm />
          </div>
        </div>

        <div ref={footerRef}>
          <ContactFooter />
        </div>
      </div>
    </section>
  )
}
