import { History, MessageSquare, Mic, Minus, Pin, PinOff, Settings, X } from 'lucide-react'
import { useInterviewStore } from '../store/interviewStore'

export function Header(): React.JSX.Element {
  const { settings, updateSettings, setShowSettings, showHistory, setShowHistory } =
    useInterviewStore()

  const isAlwaysOnTop = settings.alwaysOnTop

  const handleMinimize = (): void => {
    window.api.minimizeWindow()
  }

  const handleClose = (): void => {
    window.api.closeWindow()
  }

  const toggleAlwaysOnTop = async (): Promise<void> => {
    const newValue = !isAlwaysOnTop
    await window.api.setAlwaysOnTop(newValue)
    updateSettings({ alwaysOnTop: newValue })
  }

  return (
    <header className="flex items-center justify-between px-4 py-1.5 bg-dark-900 border-b border-dark-700 select-none app-drag">
      <div className="flex items-center gap-2 app-no-drag">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary shadow-sm">
          <Mic className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="text-xs font-bold text-dark-100 tracking-wide">Interview Copilot</span>
      </div>

      <div className="flex items-center gap-2 app-no-drag">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded hover:bg-dark-700 transition-colors ${
            showHistory ? 'text-blue-400' : 'text-dark-400'
          } hover:text-blue-400`}
          title={showHistory ? 'Back to interview session' : 'Show history'}
        >
          {showHistory ? <MessageSquare size={14} /> : <History size={14} />}
        </button>

        <button
          onClick={toggleAlwaysOnTop}
          className={`p-1.5 rounded hover:bg-dark-700 transition-colors ${
            isAlwaysOnTop ? 'text-blue-400' : 'text-dark-400'
          }`}
          title={isAlwaysOnTop ? 'Unpin window' : 'Pin window on top'}
        >
          {isAlwaysOnTop ? <Pin size={14} /> : <PinOff size={14} />}
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 rounded hover:bg-dark-700 transition-colors text-dark-400 hover:text-dark-200"
          title="Settings"
        >
          <Settings size={14} />
        </button>

        <button
          onClick={handleMinimize}
          className="p-1.5 rounded hover:bg-dark-700 transition-colors text-dark-400 hover:text-dark-200"
          title="Minimize"
        >
          <Minus size={14} />
        </button>

        <button
          onClick={handleClose}
          className="p-1.5 rounded hover:bg-red-500/20 transition-colors text-dark-400 hover:text-red-400"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  )
}
