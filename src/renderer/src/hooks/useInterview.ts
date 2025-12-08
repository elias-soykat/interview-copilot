import { useCallback, useEffect } from 'react'
import { useInterviewStore } from '../store/interviewStore'
import { AudioSource, useAudioCapture } from './useAudioCapture'

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
    setSpeaking,
    addTranscript,
    setCurrentTranscript,
    updateCurrentAnswer,
    setCurrentQuestion,
    finalizeAnswer,
    setSettings,
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

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.api.getSettings()
        setSettings(savedSettings)
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
    loadSettings()
  }, [setSettings])

  // Set up event listeners
  useEffect(() => {
    const unsubTranscript = window.api.onTranscript((event) => {
      if (event.isFinal) {
        addTranscript({
          id: Date.now().toString(),
          text: event.text,
          timestamp: Date.now(),
          isFinal: true
        })
        setCurrentTranscript('')
      } else {
        setCurrentTranscript(event.text)
      }
    })

    const unsubSpeechStarted = window.api.onSpeechStarted(() => {
      setSpeaking(true)
    })

    const unsubUtteranceEnd = window.api.onUtteranceEnd(() => {
      setSpeaking(false)
    })

    const unsubQuestionDetected = window.api.onQuestionDetected((question) => {
      setCurrentQuestion(question.text)
    })

    const unsubAnswerStream = window.api.onAnswerStream((chunk) => {
      updateCurrentAnswer(chunk)
    })

    const unsubAnswerComplete = window.api.onAnswerComplete(() => {
      finalizeAnswer()
    })

    const unsubCaptureError = window.api.onCaptureError((errorMsg) => {
      setError(errorMsg)
      setCapturing(false)
    })

    const unsubAnswerError = window.api.onAnswerError((errorMsg) => {
      setError(`Answer generation failed: ${errorMsg}`)
      finalizeAnswer()
    })

    return () => {
      unsubTranscript()
      unsubSpeechStarted()
      unsubUtteranceEnd()
      unsubQuestionDetected()
      unsubAnswerStream()
      unsubAnswerComplete()
      unsubCaptureError()
      unsubAnswerError()
    }
  }, [
    addTranscript,
    setCurrentTranscript,
    setSpeaking,
    setCurrentQuestion,
    updateCurrentAnswer,
    finalizeAnswer,
    setError,
    setCapturing
  ])

  // Sync audio capture state
  useEffect(() => {
    setCapturing(audioCapturing)
  }, [audioCapturing, setCapturing])

  // Handle audio errors
  useEffect(() => {
    if (audioError) {
      setError(audioError)
    }
  }, [audioError, setError])

  const startInterview = useCallback(
    async (source?: AudioSource) => {
      setError(null)
      clearAll()
      await startAudioCapture(source || audioSource)
    },
    [startAudioCapture, setError, clearAll, audioSource]
  )

  const stopInterview = useCallback(async () => {
    await stopAudioCapture()
  }, [stopAudioCapture])

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
    audioSource,

    // Actions
    startInterview,
    stopInterview,
    clearHistory,
    setAudioSource
  }
}
