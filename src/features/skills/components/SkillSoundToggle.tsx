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
      width="18"
      height="18"
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M4.5 9.5v5h3.2L12 18.2V5.8L7.7 9.5H4.5Z"
      />
      {muted ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          d="M15.2 9.2 20 14M20 9.2l-4.8 4.8"
        />
      ) : (
        <>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            d="M15.1 9.4a3.2 3.2 0 0 1 0 5.2"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            d="M17.4 7.2a6.2 6.2 0 0 1 0 9.6"
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
      <span className="skills-sound-toggle__text">{enabled ? 'Sound' : 'Muted'}</span>
    </button>
  )
}
