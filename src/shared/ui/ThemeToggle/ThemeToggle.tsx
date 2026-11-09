import { useTheme } from '../../theme/useTheme'
import './ThemeToggle.css'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isDark ? (
          <svg
            className="theme-toggle__sun"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="3.85" />
            <path d="M12 3.2v2.4M12 18.4v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M3.2 12h2.4M18.4 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
          </svg>
        ) : (
          <svg className="theme-toggle__moon" viewBox="0 0 24 24" width="15" height="15" aria-hidden>
            <path
              fill="currentColor"
              d="M21.2 14.1A8.25 8.25 0 1 1 9.9 2.8 6.4 6.4 0 1 0 21.2 14.1z"
            />
          </svg>
        )}
      </span>
    </button>
  )
}
