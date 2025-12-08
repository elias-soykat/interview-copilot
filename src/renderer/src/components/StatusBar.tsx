import { AlertCircle, Loader2, Mic, MicOff, Monitor, Volume2 } from 'lucide-react'
import { useInterview } from '../hooks/useInterview'

export function StatusBar(): React.JSX.Element {
  const {
    isCapturing,
    isSpeaking,
    isGenerating,
    error,
    audioSource,
    startInterview,
    stopInterview,
    setAudioSource
  } = useInterview()

  const getStatusText = () => {
    if (error) return 'Error'
    if (isGenerating) return 'Generating answer...'
    if (isSpeaking) return 'Listening...'
    if (isCapturing) {
      return audioSource === 'system'
        ? 'Listening to interviewer (System Audio)'
        : 'Listening (Microphone)'
    }
    return 'Click Start to begin'
  }

  const getStatusColor = () => {
    if (error) return 'text-red-400'
    if (isGenerating) return 'text-purple-400'
    if (isSpeaking) return 'text-green-400'
    if (isCapturing) return 'text-blue-400'
    return 'text-dark-400'
  }

  const handleStart = () => {
    startInterview(audioSource)
  }

  return (
    <div className="px-4 py-3 bg-dark-850 border-b border-dark-700">
      {/* Audio Source Toggle */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <button
          onClick={() => setAudioSource('system')}
          disabled={isCapturing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            audioSource === 'system'
              ? 'bg-blue-600 text-white'
              : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-dark-200'
          } ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Capture interviewer's voice from video call (recommended)"
        >
          <Monitor size={14} />
          <span>System Audio</span>
        </button>
        <button
          onClick={() => setAudioSource('microphone')}
          disabled={isCapturing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            audioSource === 'microphone'
              ? 'bg-blue-600 text-white'
              : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-dark-200'
          } ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Capture from microphone (captures your voice too)"
        >
          <Mic size={14} />
          <span>Microphone</span>
        </button>
      </div>

      {/* Status and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`relative ${isCapturing ? 'animate-pulse' : ''}`}>
            {isCapturing ? (
              audioSource === 'system' ? (
                <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-green-400' : 'text-blue-400'}`} />
              ) : (
                <Mic className={`w-5 h-5 ${isSpeaking ? 'text-green-400' : 'text-blue-400'}`} />
              )
            ) : (
              <MicOff className="w-5 h-5 text-dark-500" />
            )}
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
            )}
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</span>
            {error && <span className="text-xs text-red-400/80">{error}</span>}
          </div>
        </div>

        <button
          onClick={isCapturing ? stopInterview : handleStart}
          disabled={isGenerating}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              isCapturing
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing</span>
            </>
          ) : isCapturing ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              {audioSource === 'system' ? (
                <Monitor className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span>Start</span>
            </>
          )}
        </button>
      </div>

      {/* Help text */}
      {!isCapturing && audioSource === 'system' && (
        <p className="mt-2 text-xs text-dark-500 text-center">
          💡 System Audio captures the interviewer's voice from Zoom/Teams/Meet calls
        </p>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
