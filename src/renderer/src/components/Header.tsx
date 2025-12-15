import { History, Minus, Pin, PinOff, Play, Settings, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSessionTimer } from '../hooks/useSessionTimer'
import { useInterviewStore } from '../store/interviewStore'

export function Header(): React.JSX.Element {
  const {
    settings,
    setShowSettings,
    showHistory,
    setShowHistory,
    isSessionActive,
    sessionElapsedTime,
    startSession,
    endSession
  } = useInterviewStore()
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(settings.alwaysOnTop)

  // Initialize session timer hook
  useSessionTimer()

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

  const handleSessionToggle = (): void => {
    if (isSessionActive) {
      endSession()
    } else {
      startSession()
    }
  }

  const formatTimer = (elapsedMs: number): string => {
    const totalMinutes = Math.floor(elapsedMs / (60 * 1000))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-700 select-none app-drag">
      {/* <div className="flex items-center gap-2"> */}
      {/* <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse-slow" /> */}
      {/* </div> */}

      {/* Session Timer Display */}
      <div className="flex items-center gap-3">
        {isSessionActive && (
          <div className="flex items-center gap-3 px-3 py-1 bg-dark-800/50 rounded border border-dark-700/50">
            <span className="text-xs text-dark-400 font-medium">Session Time :</span>
            <span className="text-sm font-mono font-semibold text-blue-400">
              {formatTimer(sessionElapsedTime)}
            </span>
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse-slow" />
          </div>
        )}
        {!isSessionActive && sessionElapsedTime > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-dark-800/50 rounded border border-dark-700/50">
            <span className="text-xs text-dark-400 font-medium">Last Session :</span>
            <span className="text-sm font-mono font-semibold text-dark-500">
              {formatTimer(sessionElapsedTime)}
            </span>
          </div>
        )}
        <button
          onClick={handleSessionToggle}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all
            ${
              isSessionActive
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'
            }
          `}
          title={isSessionActive ? 'End Session' : 'Start Session'}
        >
          {isSessionActive ? (
            <>
              <Square size={13} />
              <span className="text-xs font-medium">End Session</span>
            </>
          ) : (
            <>
              <Play size={13} />
              <span className="text-xs font-medium">Start Session</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 app-no-drag">
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
