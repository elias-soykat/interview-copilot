import { Check, Copy, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useInterview } from '../hooks/useInterview'

export function AnswerPanel(): React.JSX.Element {
  const { answers, currentAnswer, currentQuestion, isGenerating, clearHistory } = useInterview()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [answers, currentAnswer])

  const copyToClipboard = async (text: string, id: string): Promise<void> => {
    try {
      const result = await window.api.writeToClipboard(text)
      if (result.success) {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      } else {
        console.error('Failed to copy:', result.error)
        // Fallback to browser clipboard API
        try {
          await navigator.clipboard.writeText(text)
          setCopiedId(id)
          setTimeout(() => setCopiedId(null), 2000)
        } catch (fallbackErr) {
          console.error('Fallback clipboard copy failed:', fallbackErr)
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback to browser clipboard API
      try {
        await navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      } catch (fallbackErr) {
        console.error('Fallback clipboard copy failed:', fallbackErr)
      }
    }
  }

  const hasContent = answers.length > 0 || currentAnswer

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-dark-900/30">
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-dark-300 uppercase tracking-wide">
            Suggested Answers
          </span>
        </div>
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Sparkles className="w-10 h-10 text-dark-600 mb-3" />
            <p className="text-sm text-dark-500">
              Answers will appear here when questions are detected
            </p>
            <p className="text-xs text-dark-600 mt-1">
              The AI will listen and respond to interview questions
            </p>
          </div>
        ) : (
          <>
            {answers.map((answer) => (
              <div
                key={answer.id}
                className="bg-dark-800/50 rounded-lg border border-dark-700/50 overflow-hidden animate-fade-in"
              >
                <div className="px-3 py-2 bg-dark-700/30 border-b border-dark-700/50">
                  <p className="text-xs text-dark-400 font-medium">
                    Q:{' '}
                    {answer.question.length > 100
                      ? answer.question.slice(0, 100) + '...'
                      : answer.question}
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-sm text-dark-100 leading-relaxed whitespace-pre-wrap">
                    {answer.answer}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => copyToClipboard(answer.answer, answer.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                    >
                      {copiedId === answer.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Current streaming answer */}
            {(currentAnswer || isGenerating) && (
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 overflow-hidden animate-fade-in">
                {currentQuestion && (
                  <div className="px-3 py-2 bg-purple-900/20 border-b border-purple-500/20">
                    <p className="text-xs text-purple-300 font-medium">
                      Q:{' '}
                      {currentQuestion.length > 100
                        ? currentQuestion.slice(0, 100) + '...'
                        : currentQuestion}
                    </p>
                  </div>
                )}
                <div className="p-3">
                  {currentAnswer ? (
                    <p className="text-sm text-dark-100 leading-relaxed whitespace-pre-wrap">
                      {currentAnswer}
                      <span className="inline-block w-0.5 h-4 bg-purple-400 ml-1 animate-pulse" />
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-purple-400">
                      <div className="flex gap-1">
                        <span
                          className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span>Generating answer...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
