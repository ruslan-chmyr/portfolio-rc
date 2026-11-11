import '../styles/experience.css'

const EXPERIENCE_ENTRIES = [
  {
    period: '2022 — Present',
    role: 'Senior Frontend Engineer',
    place: 'Product & platform teams',
    summary:
      'Leading UI architecture, design-system adoption, and performance-minded React delivery across complex product surfaces.',
  },
  {
    period: '2019 — 2022',
    role: 'Frontend Engineer',
    place: 'Product engineering',
    summary:
      'Built feature-rich SPAs with TypeScript, strong accessibility habits, and measurable UX improvements.',
  },
  {
    period: '2017 — 2019',
    role: 'Web Developer',
    place: 'Agency & startup work',
    summary:
      'Shipped marketing and product interfaces end-to-end — from layout systems to interactive motion.',
  },
] as const

export function ExperienceSection() {
  return (
    <section
      id="experience"
      className="experience-section"
      aria-labelledby="experience-heading"
    >
      <div className="experience-section__inner">
        <header className="experience-section__header">
          <h2 id="experience-heading" className="experience-section__title">
            Experience
          </h2>
          <p className="experience-section__lede">
            A straight scroll through roles, teams, and the kind of frontend work
            I keep coming back to.
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
    </section>
  )
}
