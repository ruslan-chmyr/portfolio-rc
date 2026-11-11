type SkillSoundToggleProps = {
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      className="skills-sound-toggle__icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M4.25 9.25v5.5h3.35L12.2 19V5L7.6 9.25H4.25Z"
      />
      {muted ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="m14.9 9.1 5 5.1M19.9 9.1l-5 5.1"
        />
      ) : (
        <>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M15.05 9.15a3.35 3.35 0 0 1 0 5.7"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M17.55 6.85a6.4 6.4 0 0 1 0 10.3"
          />
        </>
      )}
    </svg>
  )
}

export function SkillSoundToggle({
  enabled,
  onToggle,
  disabled = false,
}: SkillSoundToggleProps) {
  const label = enabled ? 'Mute keyboard sounds' : 'Enable keyboard sounds'

  return (
    <button
      type="button"
      className={[
        'skills-sound-toggle',
        enabled ? 'skills-sound-toggle--on' : 'skills-sound-toggle--muted',
      ].join(' ')}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onToggle}
    >
      <SpeakerIcon muted={!enabled} />
    </button>
  )
}
