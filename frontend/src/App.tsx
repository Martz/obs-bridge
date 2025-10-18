import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="obs-scheduler-theme">
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  )
}

export default App
