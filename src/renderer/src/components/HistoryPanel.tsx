import { Check, Clock, Copy, History, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnswerEntry } from '../store/interviewStore'

const MAX_HISTORY_LENGTH = 500

interface HistoryPanelProps {
  onClose: () => void
}

export function HistoryPanel({ onClose }: HistoryPanelProps): React.JSX.Element {
  const [history, setHistory] = useState<AnswerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async (): Promise<void> => {
    try {
      setLoading(true)
      const savedHistory = await window.api.getHistory()
      setHistory(savedHistory)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) {
      return history
    }
    const query = searchQuery.toLowerCase()
    return history.filter(
      (entry) =>
        entry.question.toLowerCase().includes(query) || entry.answer.toLowerCase().includes(query)
    )
  }, [history, searchQuery])

  const copyToClipboard = async (text: string, id: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const deleteEntry = async (id: string): Promise<void> => {
    try {
      await window.api.deleteHistoryEntry(id)
      setHistory((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err) {
      console.error('Failed to delete entry:', err)
    }
  }

  const clearAllHistory = async (): Promise<void> => {
    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return
    }
    try {
      await window.api.clearSavedHistory()
      setHistory([])
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (entryDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (entryDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-dark-900/30">
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700/50">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-dark-300 uppercase tracking-wide">
            History
          </span>
          {history.length > 0 && <span className="text-xs text-dark-500">({history.length})</span>}
          <span className="text-xs text-dark-500">
            Only stores last {MAX_HISTORY_LENGTH} answers on local storage.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Clear all history"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-dark-700 transition-colors text-dark-400 hover:text-dark-200"
            title="Close history"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {history.length > 0 && (
        <div className="px-4 py-2 border-b border-dark-700/50">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search questions and answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-dark-800/50 border border-dark-700/50 rounded text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-blue-500/50 focus:bg-dark-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-dark-700 rounded"
              >
                <X size={12} className="text-dark-500" />
              </button>
            )}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="flex gap-1 mb-3">
              <span
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <p className="text-sm text-dark-500">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <History className="w-10 h-10 text-dark-600 mb-3" />
            <p className="text-sm text-dark-500">
              {searchQuery ? 'No results found' : 'No history yet'}
            </p>
            <p className="text-xs text-dark-600 mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Your questions and answers will be saved here'}
            </p>
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <div
              key={entry.id}
              className="bg-dark-800/50 rounded-lg border border-dark-700/50 overflow-hidden animate-fade-in"
            >
              <div className="px-3 py-2 bg-dark-700/30 border-b border-dark-700/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-dark-400 font-medium mb-1">Q: {entry.question}</p>
                    <div className="flex items-center gap-1 text-xs text-dark-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(entry.timestamp)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1 hover:bg-red-500/10 rounded transition-colors text-dark-500 hover:text-red-400"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-dark-100 leading-relaxed whitespace-pre-wrap">
                  {entry.answer}
                </p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => copyToClipboard(entry.answer, entry.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                  >
                    {copiedId === entry.id ? (
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
          ))
        )}
      </div>
    </div>
  )
}
