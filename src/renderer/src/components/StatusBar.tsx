import { AlertCircle, Camera, Loader2, Play, Square, Trash2, Volume2 } from 'lucide-react'
import { useInterview } from '../hooks/useInterview'

export function StatusBar(): React.JSX.Element {
  const {
    isCapturing,
    isSpeaking,
    isGenerating,
    isProcessingScreenshot,
    error,
    startInterview,
    stopInterview,
    captureAndAnalyzeScreenshot,
    answers,
    currentAnswer,
    clearHistory
  } = useInterview()

  const getStatusText = (): string => {
    if (error) return 'Error'
    if (isProcessingScreenshot) return 'Analyzing screenshot...'
    if (isGenerating) return 'Generating answer...'
    if (isSpeaking) return 'Listening...'
    if (isCapturing) return 'Listening to interviewer (System Audio)'
    return ''
  }

  const getStatusColor = (): string => {
    if (error) return 'text-red-400'
    if (isProcessingScreenshot) return 'text-orange-400'
    if (isGenerating) return 'text-purple-400'
    if (isSpeaking) return 'text-green-400'
    if (isCapturing) return 'text-blue-400'
    return 'text-dark-400'
  }

  const handleStart = (): void => {
    startInterview('system')
  }

  const hasContent = answers.length > 0 || currentAnswer

  return (
    <div className="px-4 py-3 bg-dark-850 border-b border-dark-700">
      {/* Main Controls Row */}
      <div className="flex items-center justify-between gap-4 h-2">
        {/* Status Indicator - Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isCapturing && (
            <div className="relative flex-shrink-0 animate-pulse">
              <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-green-400' : 'text-blue-400'}`} />
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
              )}
            </div>
          )}
          {getStatusText() !== '' && (
            <div className="flex flex-col min-w-0">
              <span className={`text-sm font-medium ${getStatusColor()} truncate`}>
                {getStatusText()}
              </span>
              {error && <span className="text-xs text-red-400/80 truncate">{error}</span>}
            </div>
          )}
        </div>

        {/* Action Buttons - Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Secondary Action: Screenshot */}
          <button
            onClick={captureAndAnalyzeScreenshot}
            disabled={isProcessingScreenshot || isGenerating}
            className={`
              px-3 py-1 rounded-lg text-sm font-medium transition-all
              flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isProcessingScreenshot
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-dark-100 border border-dark-600'
              }
            `}
            title="Capture screenshot and analyze for interview questions"
          >
            {isProcessingScreenshot ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Screenshot</span>
              </>
            )}
          </button>

          {/* Primary Action: Start/Stop */}
          <button
            onClick={isCapturing ? stopInterview : handleStart}
            disabled={isGenerating || isProcessingScreenshot}
            className={`
              px-3.5 py-1 rounded-lg text-sm font-medium transition-all
              flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg
              ${
                isCapturing
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-blue-500/20'
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
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start</span>
              </>
            )}
          </button>

          {hasContent && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Clear all answers"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
