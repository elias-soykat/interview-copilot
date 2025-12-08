import { MessageSquare } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useInterview } from '../hooks/useInterview'

export function TranscriptPanel(): React.JSX.Element {
  const { transcripts, currentTranscript, isCapturing, isSpeaking } = useInterview()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcripts, currentTranscript])

  const displayText = [...transcripts.map((t) => t.text), currentTranscript]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col h-40 bg-dark-900/50 border-b border-dark-700">
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-dark-400" />
          <span className="text-xs font-semibold text-dark-300 uppercase tracking-wide">
            Live Transcript
          </span>
        </div>
        {isSpeaking && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">Speaking</span>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth custom-scrollbar"
      >
        {!isCapturing && !displayText ? (
          <p className="text-sm text-dark-500 italic">
            Start listening to see real-time transcription...
          </p>
        ) : displayText ? (
          <p className="text-sm text-dark-200 leading-relaxed">
            {displayText}
            {currentTranscript && (
              <span className="inline-block w-0.5 h-4 bg-blue-400 ml-1 animate-pulse" />
            )}
          </p>
        ) : (
          <p className="text-sm text-dark-500 italic">Waiting for speech...</p>
        )}
      </div>
    </div>
  )
}
