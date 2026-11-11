import {
  EXPERIENCE_CV_CTA,
  EXPERIENCE_CV_PDF_URL,
  isExperienceCvPdfConfigured,
} from '../model/experienceConfig'

function DocumentIcon() {
  return (
    <svg
      className="experience-cv-cta__icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M9 13h6M9 17h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ExternalArrowIcon() {
  return (
    <svg
      className="experience-cv-cta__arrow"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 17 17 7M10 7h7v7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * CV invite at the end of the left timeline column — under the final year.
 * Disabled when no public PDF URL is configured.
 */
export function ExperienceCvCta() {
  const enabled = isExperienceCvPdfConfigured(EXPERIENCE_CV_PDF_URL)
  const label = (
    <>
      <DocumentIcon />
      <span>{EXPERIENCE_CV_CTA.buttonLabel}</span>
      <ExternalArrowIcon />
    </>
  )

  return (
    <div className="experience-cv-cta" data-experience-cta>
      <p className="experience-cv-cta__text">{EXPERIENCE_CV_CTA.description}</p>
      {enabled ? (
        <a
          className="experience-cv-cta__button"
          href={EXPERIENCE_CV_PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      ) : (
        <span
          className="experience-cv-cta__button experience-cv-cta__button--disabled"
          aria-disabled="true"
        >
          {label}
        </span>
      )}
    </div>
  )
}
