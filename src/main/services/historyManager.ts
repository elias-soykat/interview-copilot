import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { AnswerEntry } from '../../preload/index'

const MAX_HISTORY_LENGTH = 500

export class HistoryManager {
  private historyPath: string
  private maxHistoryLength: number = MAX_HISTORY_LENGTH

  constructor() {
    const userDataPath = app.getPath('userData')
    this.historyPath = path.join(userDataPath, 'history.json')
  }

  private loadHistory(): AnswerEntry[] {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf-8')
        const history = JSON.parse(data)
        // Validate that it's an array
        if (Array.isArray(history)) {
          return history
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
    return []
  }

  private saveHistory(history: AnswerEntry[]): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.historyPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2))
    } catch (error) {
      console.error('Failed to save history:', error)
    }
  }

  getHistory(): AnswerEntry[] {
    const history = this.loadHistory()
    // Ensure history doesn't exceed 500 entries
    if (history.length > this.maxHistoryLength) {
      const trimmedHistory = history.slice(0, this.maxHistoryLength)
      this.saveHistory(trimmedHistory)
      return trimmedHistory
    }
    return history
  }

  addEntry(entry: AnswerEntry): void {
    const history = this.loadHistory()
    // Add new entry at the beginning (most recent first)
    history.unshift(entry)
    // Keep only last 500 entries to prevent file from growing too large
    const trimmedHistory = history.slice(0, this.maxHistoryLength)
    this.saveHistory(trimmedHistory)
  }

  addEntries(entries: AnswerEntry[]): void {
    const history = this.loadHistory()
    // Add new entries at the beginning
    const newHistory = [...entries, ...history]
    // Remove duplicates based on id
    const uniqueHistory = Array.from(new Map(newHistory.map((entry) => [entry.id, entry])).values())
    // Keep only last 500 entries
    const trimmedHistory = uniqueHistory.slice(0, this.maxHistoryLength)
    this.saveHistory(trimmedHistory)
  }

  clearHistory(): void {
    this.saveHistory([])
  }

  deleteEntry(id: string): void {
    const history = this.loadHistory()
    const filteredHistory = history.filter((entry) => entry.id !== id)
    this.saveHistory(filteredHistory)
  }
}
