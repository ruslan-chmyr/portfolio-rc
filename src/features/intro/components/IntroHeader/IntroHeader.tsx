import { ThemeToggle } from '../../../../shared/ui/ThemeToggle/ThemeToggle'
import { IntroScrollHint } from '../IntroAnimation/IntroScrollHint'
import './IntroHeader.css'

export function IntroHeader() {
  return (
    <>
      <div className="intro-animation__header">
        <ThemeToggle />
      </div>
      <div className="intro-animation__scroll-corner">
        <IntroScrollHint />
      </div>
    </>
  )
}
