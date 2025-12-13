import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Types for the API
export interface TranscriptEvent {
  text: string
  isFinal: boolean
  confidence: number
}

export interface DetectedQuestion {
  text: string
  confidence: number
  questionType: 'direct' | 'indirect' | 'rhetorical' | 'unknown'
}

export interface AppSettings {
  openaiApiKey: string
  openaiModel: string
  alwaysOnTop: boolean
  windowOpacity: number
  pauseThreshold: number
  autoStart: boolean
  resumeDescription: string
}

export interface AudioSource {
  id: string
  name: string
  thumbnail: string
}

export interface AnswerEntry {
  id: string
  question: string
  answer: string
  timestamp: number
  isStreaming: boolean
}

// Custom APIs for renderer
const api = {
  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
  updateSettings: (updates: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('update-settings', updates),
  hasApiKeys: (): Promise<boolean> => ipcRenderer.invoke('has-api-keys'),
  fetchOpenAIModels: (
    apiKey: string
  ): Promise<{ success: boolean; models: Array<{ id: string; name: string }>; error?: string }> =>
    ipcRenderer.invoke('fetch-openai-models', apiKey),

  // Audio capture
  startCapture: (): Promise<{ success: boolean }> => ipcRenderer.invoke('start-capture'),
  stopCapture: (): Promise<{ success: boolean }> => ipcRenderer.invoke('stop-capture'),
  getCaptureStatus: (): Promise<boolean> => ipcRenderer.invoke('get-capture-status'),
  sendAudioData: (audioData: ArrayBuffer): void => ipcRenderer.send('audio-data', audioData),
  getAudioSources: (): Promise<AudioSource[]> => ipcRenderer.invoke('get-audio-sources'),

  // Window controls
  setAlwaysOnTop: (value: boolean): Promise<boolean> =>
    ipcRenderer.invoke('set-always-on-top', value),
  setWindowOpacity: (value: number): Promise<number> =>
    ipcRenderer.invoke('set-window-opacity', value),
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('minimize-window'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('close-window'),

  // Conversation
  clearHistory: (): Promise<{ success: boolean }> => ipcRenderer.invoke('clear-history'),

  // History
  getHistory: (): Promise<AnswerEntry[]> => ipcRenderer.invoke('get-history'),
  saveHistoryEntry: (entry: AnswerEntry): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('save-history-entry', entry),
  saveHistoryEntries: (entries: AnswerEntry[]): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('save-history-entries', entries),
  clearSavedHistory: (): Promise<{ success: boolean }> => ipcRenderer.invoke('clear-saved-history'),
  deleteHistoryEntry: (id: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('delete-history-entry', id),

  // Event listeners
  onTranscript: (callback: (event: TranscriptEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: TranscriptEvent): void =>
      callback(data)
    ipcRenderer.on('transcript', handler)
    return () => ipcRenderer.removeListener('transcript', handler)
  },

  onUtteranceEnd: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('utterance-end', handler)
    return () => ipcRenderer.removeListener('utterance-end', handler)
  },

  onSpeechStarted: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('speech-started', handler)
    return () => ipcRenderer.removeListener('speech-started', handler)
  },

  onQuestionDetected: (callback: (question: DetectedQuestion) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: DetectedQuestion): void =>
      callback(data)
    ipcRenderer.on('question-detected', handler)
    return () => ipcRenderer.removeListener('question-detected', handler)
  },

  onAnswerStream: (callback: (chunk: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: string): void => callback(chunk)
    ipcRenderer.on('answer-stream', handler)
    return () => ipcRenderer.removeListener('answer-stream', handler)
  },

  onAnswerComplete: (callback: (answer: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, answer: string): void => callback(answer)
    ipcRenderer.on('answer-complete', handler)
    return () => ipcRenderer.removeListener('answer-complete', handler)
  },

  onCaptureError: (callback: (error: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string): void => callback(error)
    ipcRenderer.on('capture-error', handler)
    return () => ipcRenderer.removeListener('capture-error', handler)
  },

  onAnswerError: (callback: (error: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string): void => callback(error)
    ipcRenderer.on('answer-error', handler)
    return () => ipcRenderer.removeListener('answer-error', handler)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
