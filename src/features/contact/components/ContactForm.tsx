import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  hasContactErrors,
  validateContactForm,
  type ContactFieldErrors,
  type ContactFormValues,
} from '../lib/contactValidation'
import { submitContactMessage } from '../lib/submitContactMessage'
import { CONTACT_CONFIG, CONTACT_FIELD_LIMITS } from '../model/contactConfig'

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.5 20 4l-5.5 16-2.8-6.2L4 11.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type FormStatus = 'idle' | 'sending' | 'success' | 'error' | 'unavailable'

const INITIAL: ContactFormValues = {
  name: '',
  email: '',
  message: '',
  company: '',
}

export function ContactForm() {
  const formId = useId()
  const [values, setValues] = useState<ContactFormValues>(INITIAL)
  const [errors, setErrors] = useState<ContactFieldErrors>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const disabled = status === 'sending' || status === 'unavailable'

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled) return

    const nextErrors = validateContactForm(values)
    setErrors(nextErrors)
    if (hasContactErrors(nextErrors)) {
      setStatus('idle')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('sending')
    const result = await submitContactMessage(values, { signal: controller.signal })
    if (!mountedRef.current || controller.signal.aborted) return

    if (result.ok) {
      setValues(INITIAL)
      setErrors({})
      setStatus('success')
      return
    }

    if (result.reason === 'validation' && result.errors) {
      setErrors(result.errors)
      setStatus('idle')
      return
    }

    if (result.reason === 'unavailable') {
      setStatus('unavailable')
      return
    }

    // Keep field values on failure so the visitor can retry.
    setStatus('error')
  }

  return (
    <div className="contact-form" data-contact-form>
      <header className="contact-form__header">
        <h3 className="contact-form__title">{CONTACT_CONFIG.formTitle}</h3>
        <p className="contact-form__lede">{CONTACT_CONFIG.formLede}</p>
      </header>

      <form
        className="contact-form__form"
        onSubmit={(event) => {
          void onSubmit(event)
        }}
        noValidate
      >
        <div className="contact-form__honeypot" aria-hidden="true">
          <label htmlFor={`${formId}-company`}>Company</label>
          <input
            id={`${formId}-company`}
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={values.company}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, company: event.target.value }))
            }
          />
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor={`${formId}-name`}>Full name</label>
            <input
              id={`${formId}-name`}
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              maxLength={CONTACT_FIELD_LIMITS.name}
              value={values.name}
              disabled={disabled}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${formId}-name-error` : undefined}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            {errors.name ? (
              <p id={`${formId}-name-error`} className="contact-form__error">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="contact-form__field">
            <label htmlFor={`${formId}-email`}>Email address</label>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              maxLength={CONTACT_FIELD_LIMITS.email}
              value={values.email}
              disabled={disabled}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${formId}-email-error` : undefined}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, email: event.target.value }))
              }
            />
            {errors.email ? (
              <p id={`${formId}-email-error`} className="contact-form__error">
                {errors.email}
              </p>
            ) : null}
          </div>
        </div>

        <div className="contact-form__field">
          <label htmlFor={`${formId}-message`}>Your message</label>
          <textarea
            id={`${formId}-message`}
            name="message"
            rows={5}
            placeholder="Tell me about your project or opportunity..."
            maxLength={CONTACT_FIELD_LIMITS.message}
            value={values.message}
            disabled={disabled}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? `${formId}-message-error` : undefined
            }
            onChange={(event) =>
              setValues((prev) => ({ ...prev, message: event.target.value }))
            }
          />
          {errors.message ? (
            <p id={`${formId}-message-error`} className="contact-form__error">
              {errors.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          className="contact-form__submit"
          disabled={disabled}
        >
          <SendIcon />
          <span>{status === 'sending' ? 'Sending…' : 'Send Message'}</span>
        </button>

        <p className="contact-form__privacy">{CONTACT_CONFIG.privacyNote}</p>

        <div className="contact-form__status" aria-live="polite">
          {status === 'success' ? CONTACT_CONFIG.successMessage : null}
          {status === 'error' ? CONTACT_CONFIG.errorMessage : null}
          {status === 'unavailable' ? CONTACT_CONFIG.unavailableMessage : null}
          {errors.form ? errors.form : null}
        </div>
      </form>
    </div>
  )
}
