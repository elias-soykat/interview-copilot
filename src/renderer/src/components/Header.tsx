import { History, Minus, Pin, PinOff, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useInterviewStore } from '../store/interviewStore'

export function Header(): React.JSX.Element {
  const { settings, setShowSettings, showHistory, setShowHistory } = useInterviewStore()
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(settings.alwaysOnTop)

  useEffect(() => {
    setTimeout(() => {
      setIsAlwaysOnTop(settings.alwaysOnTop)
    }, 100)
  }, [settings.alwaysOnTop])

  const handleMinimize = (): void => {
    window.api.minimizeWindow()
  }

  const handleClose = (): void => {
    window.api.closeWindow()
  }

  const toggleAlwaysOnTop = async (): Promise<void> => {
    const newValue = !isAlwaysOnTop
    await window.api.setAlwaysOnTop(newValue)
    setIsAlwaysOnTop(newValue)
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-700 select-none app-drag">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse-slow" />
        <h1 className="text-sm font-semibold text-dark-100">Interview Assistant</h1>
      </div>

      <div className="flex items-center gap-1 app-no-drag">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded hover:bg-dark-700 transition-colors ${
            showHistory ? 'text-blue-400' : 'text-dark-400'
          } hover:text-blue-400`}
          title={showHistory ? 'Show current session' : 'Show history'}
        >
          <History size={14} />
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
