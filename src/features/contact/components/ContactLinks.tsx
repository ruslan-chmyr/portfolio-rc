import { useState } from 'react'
import githubIcon from '../assets/github.svg'
import linkedinIcon from '../assets/linkedin.svg'
import telegramIcon from '../assets/telegram.svg'
import { CONTACT_CONFIG, type ContactSocial } from '../model/contactConfig'

const SOCIAL_ICONS: Record<ContactSocial['id'], string> = {
  github: githubIcon,
  linkedin: linkedinIcon,
  telegram: telegramIcon,
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // fall through
  }

  try {
    const input = document.createElement('textarea')
    input.value = value
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.append(input)
    input.select()
    const ok = document.execCommand('copy')
    input.remove()
    return ok
  } catch {
    return false
  }
}

export function ContactLinks() {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    const ok = await copyText(CONTACT_CONFIG.email)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="contact-links" data-contact-links>
      <div className="contact-links__email-row">
        <span className="contact-links__email-icon" aria-hidden="true">
          <EmailIcon />
        </span>
        <a className="contact-links__email" href={`mailto:${CONTACT_CONFIG.email}`}>
          {CONTACT_CONFIG.email}
        </a>
        <button
          type="button"
          className="contact-links__copy"
          onClick={() => {
            void onCopy()
          }}
          aria-label={copied ? 'Email copied' : 'Copy email address'}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {copied ? 'Email address copied to clipboard.' : ''}
      </p>

      <ul className="contact-links__socials">
        {CONTACT_CONFIG.socials.map((social) => (
          <li key={social.id}>
            <a
              className="contact-links__social"
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${social.label} (opens in a new tab)`}
            >
              <img
                className="contact-links__social-icon"
                src={SOCIAL_ICONS[social.id]}
                alt=""
                width={18}
                height={18}
                data-social={social.id}
                decoding="async"
              />
              <span>{social.label}</span>
              <ExternalIcon />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
