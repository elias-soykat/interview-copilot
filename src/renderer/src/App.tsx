import { useEffect } from 'react'
import { AnswerPanel } from './components/AnswerPanel'
import { Header } from './components/Header'
import { HistoryPanel } from './components/HistoryPanel'
import { SettingsModal } from './components/SettingsModal'
import { StatusBar } from './components/StatusBar'
import { TranscriptPanel } from './components/TranscriptPanel'
import { useInterviewEvents } from './hooks/useInterviewEvents'
import { useInterviewStore } from './store/interviewStore'

function App(): React.JSX.Element {
  const { setShowSettings, settings, showHistory, setShowHistory } = useInterviewStore()

  // Set up IPC event listeners ONCE at the app level
  useInterviewEvents()

  // Check for API keys on mount
  useEffect(() => {
    const checkApiKeys = async (): Promise<void> => {
      try {
        // Check if API key is missing
        const hasApiKeys = await window.api.hasApiKeys()

        // Show settings modal if API keys are not configured
        if (!hasApiKeys) {
          setShowSettings(true)
        }
      } catch (err) {
        console.error('Failed to check required configuration:', err)
      }
    }
    checkApiKeys()
  }, [])

  // Apply window opacity from settings
  useEffect(() => {
    if (settings.windowOpacity && settings.windowOpacity !== 1) {
      window.api.setWindowOpacity(settings.windowOpacity)
    }
  }, [settings.windowOpacity])

  return (
    <div className="flex flex-col h-screen bg-dark-950 text-dark-100 overflow-hidden">
      <Header />
      <StatusBar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TranscriptPanel />
        {showHistory ? <HistoryPanel onClose={() => setShowHistory(false)} /> : <AnswerPanel />}
      </main>
      <SettingsModal />
    </div>
  )
}

export default App
