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
    isProcessingScreenshot,
    transcripts,
    currentTranscript,
    answers,
    currentAnswer,
    currentQuestion,
    settings,
    error,
    setCapturing,
    setError,
    setProcessingScreenshot,
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

  const captureAndAnalyzeScreenshot = useCallback(async () => {
    try {
      setError(null)
      setProcessingScreenshot(true)

      // Capture screenshot
      const captureResult = await window.api.captureScreenshot()

      if (!captureResult.success || !captureResult.imageData) {
        throw new Error(captureResult.error || 'Failed to capture screenshot')
      }

      // Analyze screenshot
      const analysisResult = await window.api.analyzeScreenshot(captureResult.imageData)

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Failed to analyze screenshot')
      }

      if (!analysisResult.isQuestion) {
        setError(analysisResult.message || 'No interview question detected in the screenshot')
      }
      // If question is detected, the answer generation will be handled by event listeners
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process screenshot'
      setError(errorMessage)
      console.error('Screenshot capture/analysis error:', err)
    } finally {
      setProcessingScreenshot(false)
    }
  }, [setError, setProcessingScreenshot])

  return {
    // State
    isCapturing: storeCapturing || audioCapturing,
    isGenerating,
    isSpeaking,
    isProcessingScreenshot,
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
    setAudioSource,
    captureAndAnalyzeScreenshot
  }
}
