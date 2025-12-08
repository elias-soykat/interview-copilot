import { useCallback } from 'react'
import { useInterviewStore } from '../store/interviewStore'
import { AudioSource, useAudioCapture } from './useAudioCapture'

/**
 * Hook for interview state and actions.
 * NOTE: IPC listeners are set up separately in useInterviewEvents (called from App.tsx)
 */
export function useInterview() {
  const {
    isCapturing: storeCapturing,
    isGenerating,
    isSpeaking,
    transcripts,
    currentTranscript,
    answers,
    currentAnswer,
    currentQuestion,
    settings,
    error,
    setCapturing,
    setError,
    clearAll
  } = useInterviewStore()

  const {
    isCapturing: audioCapturing,
    error: audioError,
    audioSource,
    startCapture: startAudioCapture,
    stopCapture: stopAudioCapture,
    setAudioSource
  } = useAudioCapture()

  // Sync audio capture state with store
  // This is handled in the component that calls startInterview
  const startInterview = useCallback(
    async (source?: AudioSource) => {
      setError(null)
      clearAll()
      try {
        await startAudioCapture(source || audioSource)
        setCapturing(true)
      } catch (err) {
        setCapturing(false)
        throw err
      }
    },
    [startAudioCapture, setError, clearAll, audioSource, setCapturing]
  )

  const stopInterview = useCallback(async () => {
    await stopAudioCapture()
    setCapturing(false)
  }, [stopAudioCapture, setCapturing])

  const clearHistory = useCallback(async () => {
    try {
      await window.api.clearHistory()
      clearAll()
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }, [clearAll])

  return {
    // State
    isCapturing: storeCapturing || audioCapturing,
    isGenerating,
    isSpeaking,
    transcripts,
    currentTranscript,
    answers,
    currentAnswer,
    currentQuestion,
    settings,
    error: error || audioError,
    audioSource,

    // Actions
    startInterview,
    stopInterview,
    clearHistory,
    setAudioSource
  }
}
