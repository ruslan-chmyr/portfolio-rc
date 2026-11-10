import { PortfolioApp } from './app/PortfolioApp'
import { ThemeProvider } from './shared/theme'

function App() {
  return (
    <ThemeProvider>
      <PortfolioApp />
    </ThemeProvider>
  )
}

export default App
