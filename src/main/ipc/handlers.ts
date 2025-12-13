import { BrowserWindow, desktopCapturer, ipcMain } from 'electron'
import { AnswerEntry } from '../../preload/index'
import { HistoryManager } from '../services/historyManager'
import { OpenAIService } from '../services/openaiService'
import { QuestionDetector } from '../services/questionDetector'
import { AppSettings, SettingsManager } from '../services/settingsManager'
import { WhisperService } from '../services/whisperService'

let whisperService: WhisperService | null = null
let openaiService: OpenAIService | null = null
let questionDetector: QuestionDetector | null = null
let settingsManager: SettingsManager | null = null
let historyManager: HistoryManager | null = null
let mainWindow: BrowserWindow | null = null
let isCapturing = false

export function initializeIpcHandlers(window: BrowserWindow): void {
  mainWindow = window
  settingsManager = new SettingsManager()
  historyManager = new HistoryManager()
  questionDetector = new QuestionDetector()

  // Settings handlers
  ipcMain.handle('get-settings', () => {
    return settingsManager?.getSettings()
  })

  ipcMain.handle('update-settings', (_event, updates: Partial<AppSettings>) => {
    settingsManager?.updateSettings(updates)

    // Apply window settings immediately
    if (updates.alwaysOnTop !== undefined && mainWindow) {
      mainWindow.setAlwaysOnTop(updates.alwaysOnTop)
    }
    if (updates.windowOpacity !== undefined && mainWindow) {
      mainWindow.setOpacity(updates.windowOpacity)
    }

    return settingsManager?.getSettings()
  })

  ipcMain.handle('has-api-keys', () => {
    return settingsManager?.hasApiKeys()
  })

  // Fetch OpenAI models
  ipcMain.handle('fetch-openai-models', async (_event, apiKey: string) => {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('API key is required')
      }

      const OpenAI = (await import('openai')).default
      const client = new OpenAI({ apiKey })

      const response = await client.models.list()

      // Filter for chat completion models and sort them
      const chatModels = response.data.map((model) => ({
        id: model.id,
        name: model.id
      }))

      return { success: true, models: chatModels }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch models'
      console.error('Error fetching OpenAI models:', errorMessage)
      return { success: false, error: errorMessage, models: [] }
    }
  })

  // Audio capture handlers
  ipcMain.handle('start-capture', async () => {
    const settings = settingsManager?.getSettings()

    // Debug: Log API key status (not the actual keys)
    console.log('API Keys configured:', {
      openai: settings?.openaiApiKey ? `Yes (${settings.openaiApiKey.length} chars)` : 'No'
    })

    if (!settings?.openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please add it in Settings.')
    }

    try {
      // IMPORTANT: Clean up any existing services/listeners first to prevent duplicates
      if (whisperService) {
        whisperService.removeAllListeners()
        whisperService = null
      }
      if (openaiService) {
        openaiService.removeAllListeners()
        openaiService = null
      }
      questionDetector?.removeAllListeners()

      // Initialize Whisper service for transcription
      whisperService = new WhisperService({
        apiKey: settings.openaiApiKey,
        model: 'whisper-1',
        language: 'en'
      })

      // Initialize OpenAI service for answer generation
      openaiService = new OpenAIService({
        apiKey: settings.openaiApiKey,
        model: settings.openaiModel,
        resumeDescription: settings.resumeDescription
      })

      // Set up OpenAI event listeners ONCE
      openaiService.on('stream', (chunk) => {
        mainWindow?.webContents.send('answer-stream', chunk)
      })

      openaiService.on('complete', (answer) => {
        mainWindow?.webContents.send('answer-complete', answer)
      })

      // Set up Whisper event listeners
      whisperService.on('transcript', async (event) => {
        console.log('Transcript received:', event.text)
        questionDetector?.addTranscript(event.text, event.isFinal)
        mainWindow?.webContents.send('transcript', event)

        // Try early detection for faster response on high-confidence questions
        if (event.isFinal && questionDetector && openaiService) {
          const earlyDetection = questionDetector.checkEarlyDetection(event.text)
          if (earlyDetection) {
            console.log('Early question detection triggered:', earlyDetection.text)
            mainWindow?.webContents.send('question-detected', earlyDetection)
            try {
              await openaiService.generateAnswer(earlyDetection.text)
            } catch (error) {
              mainWindow?.webContents.send('answer-error', (error as Error).message)
            }
          }
        }
      })

      whisperService.on('utteranceEnd', () => {
        console.log('Processing utterance...')
        questionDetector?.onUtteranceEnd()
        mainWindow?.webContents.send('utterance-end')
      })

      whisperService.on('speechStarted', () => {
        mainWindow?.webContents.send('speech-started')
      })

      whisperService.on('error', (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown capture error'
        console.error('Whisper error:', errorMessage)
        mainWindow?.webContents.send('capture-error', errorMessage)
      })

      // Set up question detector listener ONCE
      questionDetector?.on('questionDetected', async (detection) => {
        console.log('Question detected:', detection.text)
        mainWindow?.webContents.send('question-detected', detection)

        if (openaiService) {
          try {
            await openaiService.generateAnswer(detection.text)
          } catch (error) {
            mainWindow?.webContents.send('answer-error', (error as Error).message)
          }
        }
      })

      // Start Whisper service
      whisperService.start()
      isCapturing = true
      console.log('Audio capture started successfully')

      return { success: true }
    } catch (error) {
      console.error('start-capture error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start capture'
      throw new Error(errorMessage)
    }
  })

  ipcMain.handle('stop-capture', async () => {
    isCapturing = false

    if (whisperService) {
      whisperService.stop()
      whisperService.removeAllListeners()
      whisperService = null
    }

    if (openaiService) {
      openaiService.removeAllListeners()
      openaiService = null
    }

    // Remove question detector listeners to prevent duplicates on next start
    questionDetector?.removeAllListeners()
    questionDetector?.clearBuffer()
    console.log('Audio capture stopped')

    return { success: true }
  })

  ipcMain.handle('get-capture-status', () => {
    return isCapturing
  })

  // Audio data from renderer
  ipcMain.on('audio-data', (_event, audioData: ArrayBuffer) => {
    if (whisperService && isCapturing) {
      whisperService.addAudioData(audioData)
    }
  })

  // Get audio sources for system audio capture
  ipcMain.handle('get-audio-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      fetchWindowIcons: true
    })

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }))
  })

  // Window control handlers
  ipcMain.handle('set-always-on-top', (_event, value: boolean) => {
    mainWindow?.setAlwaysOnTop(value)
    settingsManager?.setSetting('alwaysOnTop', value)
    return value
  })

  ipcMain.handle('set-window-opacity', (_event, value: number) => {
    mainWindow?.setOpacity(value)
    settingsManager?.setSetting('windowOpacity', value)
    return value
  })

  ipcMain.handle('minimize-window', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('close-window', () => {
    mainWindow?.close()
  })

  // Clear conversation history
  ipcMain.handle('clear-history', () => {
    openaiService?.clearHistory()
    return { success: true }
  })

  // History handlers
  ipcMain.handle('get-history', () => {
    return historyManager?.getHistory() || []
  })

  ipcMain.handle('save-history-entry', (_event, entry: AnswerEntry) => {
    historyManager?.addEntry(entry)
    return { success: true }
  })

  ipcMain.handle('save-history-entries', (_event, entries: AnswerEntry[]) => {
    historyManager?.addEntries(entries)
    return { success: true }
  })

  ipcMain.handle('clear-saved-history', () => {
    historyManager?.clearHistory()
    return { success: true }
  })

  ipcMain.handle('delete-history-entry', (_event, id: string) => {
    historyManager?.deleteEntry(id)
    return { success: true }
  })
}

export function cleanupIpcHandlers(): void {
  if (whisperService) {
    whisperService.stop()
    whisperService = null
  }
  if (openaiService) {
    openaiService = null
  }
  questionDetector = null
  settingsManager = null
  historyManager = null
  mainWindow = null
  isCapturing = false
}
