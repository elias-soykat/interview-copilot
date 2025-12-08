import { ElectronAPI } from '@electron-toolkit/preload'

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
}

export interface AudioSource {
  id: string
  name: string
  thumbnail: string
}

export interface Api {
  // Settings
  getSettings: () => Promise<AppSettings>
  updateSettings: (updates: Partial<AppSettings>) => Promise<AppSettings>
  hasApiKeys: () => Promise<boolean>

  // Audio capture
  startCapture: () => Promise<{ success: boolean }>
  stopCapture: () => Promise<{ success: boolean }>
  getCaptureStatus: () => Promise<boolean>
  sendAudioData: (audioData: ArrayBuffer) => void
  getAudioSources: () => Promise<AudioSource[]>

  // Window controls
  setAlwaysOnTop: (value: boolean) => Promise<boolean>
  setWindowOpacity: (value: number) => Promise<number>
  minimizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>

  // Conversation
  clearHistory: () => Promise<{ success: boolean }>

  // Event listeners
  onTranscript: (callback: (event: TranscriptEvent) => void) => () => void
  onUtteranceEnd: (callback: () => void) => () => void
  onSpeechStarted: (callback: () => void) => () => void
  onQuestionDetected: (callback: (question: DetectedQuestion) => void) => () => void
  onAnswerStream: (callback: (chunk: string) => void) => () => void
  onAnswerComplete: (callback: (answer: string) => void) => () => void
  onCaptureError: (callback: (error: string) => void) => () => void
  onAnswerError: (callback: (error: string) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
