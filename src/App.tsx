import { IntroAnimation } from './components/IntroAnimation/IntroAnimation'
import { ThemeProvider } from './shared/theme'

function App() {
  return (
    <ThemeProvider>
      <IntroAnimation />
    </ThemeProvider>
  )
}

export default App
