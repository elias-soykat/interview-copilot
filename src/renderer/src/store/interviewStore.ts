import { create } from 'zustand'

export interface TranscriptEntry {
  id: string
  text: string
  timestamp: number
  isFinal: boolean
}

export interface AnswerEntry {
  id: string
  question: string
  answer: string
  timestamp: number
  isStreaming: boolean
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

interface InterviewState {
  // Status
  isCapturing: boolean
  isConnected: boolean
  isSpeaking: boolean
  isGenerating: boolean
  isProcessingScreenshot: boolean

  // Transcripts
  transcripts: TranscriptEntry[]
  currentTranscript: string

  // Answers
  answers: AnswerEntry[]
  currentAnswer: string
  currentQuestion: string

  // Settings
  settings: AppSettings
  showSettings: boolean

  // History view
  showHistory: boolean

  // Errors
  error: string | null

  // Actions
  setCapturing: (isCapturing: boolean) => void
  setConnected: (isConnected: boolean) => void
  setSpeaking: (isSpeaking: boolean) => void
  setGenerating: (isGenerating: boolean) => void
  setProcessingScreenshot: (processing: boolean) => void

  addTranscript: (entry: TranscriptEntry) => void
  setCurrentTranscript: (text: string) => void
  clearTranscripts: () => void

  addAnswer: (entry: AnswerEntry) => void
  updateCurrentAnswer: (chunk: string) => void
  setCurrentQuestion: (question: string) => void
  finalizeAnswer: () => void | Promise<void>
  clearAnswers: () => void

  setSettings: (settings: AppSettings) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  setShowSettings: (show: boolean) => void

  setShowHistory: (show: boolean) => void

  setError: (error: string | null) => void
  clearAll: () => void
}

const DEFAULT_SETTINGS: AppSettings = {
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  alwaysOnTop: true,
  windowOpacity: 1.0,
  pauseThreshold: 1500,
  autoStart: false,
  resumeDescription: ''
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  // Initial state
  isCapturing: false,
  isConnected: false,
  isSpeaking: false,
  isGenerating: false,
  isProcessingScreenshot: false,

  transcripts: [],
  currentTranscript: '',

  answers: [],
  currentAnswer: '',
  currentQuestion: '',

  settings: DEFAULT_SETTINGS,
  showSettings: false,
  showHistory: false,

  error: null,

  // Actions
  setCapturing: (isCapturing) => set({ isCapturing }),
  setConnected: (isConnected) => set({ isConnected }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setProcessingScreenshot: (processing) => set({ isProcessingScreenshot: processing }),

  addTranscript: (entry) =>
    set((state) => ({
      transcripts: [...state.transcripts.slice(-50), entry] // Keep last 50 entries
    })),

  setCurrentTranscript: (text) => set({ currentTranscript: text }),

  clearTranscripts: () => set({ transcripts: [], currentTranscript: '' }),

  addAnswer: (entry) =>
    set((state) => ({
      answers: [...state.answers, entry],
      currentAnswer: '',
      currentQuestion: entry.question
    })),

  updateCurrentAnswer: (chunk) =>
    set((state) => ({
      currentAnswer: state.currentAnswer + chunk,
      isGenerating: true
    })),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  finalizeAnswer: async () => {
    const state = get()
    if (state.currentAnswer && state.currentQuestion) {
      const entry: AnswerEntry = {
        id: Date.now().toString(),
        question: state.currentQuestion,
        answer: state.currentAnswer,
        timestamp: Date.now(),
        isStreaming: false
      }
      set((state) => ({
        answers: [...state.answers.slice(-20), entry], // Keep last 20 answers
        currentAnswer: '',
        currentQuestion: '',
        isGenerating: false
      }))
      // Save to history
      try {
        await window.api.saveHistoryEntry(entry)
      } catch (err) {
        console.error('Failed to save history entry:', err)
      }
    } else {
      set({ isGenerating: false })
    }
  },

  clearAnswers: () => set({ answers: [], currentAnswer: '', currentQuestion: '' }),

  setSettings: (settings) => set({ settings }),

  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates }
    })),

  setShowSettings: (show) => set({ showSettings: show }),

  setShowHistory: (show) => set({ showHistory: show }),

  setError: (error) => set({ error }),

  clearAll: () =>
    set({
      transcripts: [],
      currentTranscript: '',
      answers: [],
      currentAnswer: '',
      currentQuestion: '',
      error: null
    })
}))
