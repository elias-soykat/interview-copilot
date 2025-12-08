/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

// Re-export types from preload
export type {
  Api,
  AppSettings,
  AudioSource,
  DetectedQuestion,
  TranscriptEvent
} from '../../preload/index.d'
