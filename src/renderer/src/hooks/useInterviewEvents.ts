import { useEffect, useRef } from 'react'
import { useInterviewStore } from '../store/interviewStore'

/**
 * This hook sets up IPC event listeners ONCE.
 * It should only be called from App.tsx to prevent duplicate listeners.
 */
export function useInterviewEvents() {
  const {
    addTranscript,
    setCurrentTranscript,
    setSpeaking,
    setCurrentQuestion,
    updateCurrentAnswer,
    finalizeAnswer,
    setError,
    setCapturing,
    setSettings
  } = useInterviewStore()

  // Use ref to ensure listeners are only set up once
  const listenersSetUp = useRef(false)

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

  // Set up event listeners ONCE
  useEffect(() => {
    // Prevent setting up listeners multiple times
    if (listenersSetUp.current) {
      return
    }
    listenersSetUp.current = true

    console.log('Setting up IPC event listeners (once)')

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

    const unsubQuestionDetectedFromImage = window.api.onQuestionDetectedFromImage((question) => {
      console.log('Question detected from screenshot:', question.text)
      setCurrentQuestion(question.text)
    })

    const unsubScreenshotNoQuestion = window.api.onScreenshotNoQuestion((data) => {
      console.log('No question detected in screenshot:', data.message)
      setError(data.message)
    })

    return () => {
      console.log('Cleaning up IPC event listeners')
      unsubTranscript()
      unsubSpeechStarted()
      unsubUtteranceEnd()
      unsubQuestionDetected()
      unsubAnswerStream()
      unsubAnswerComplete()
      unsubCaptureError()
      unsubAnswerError()
      unsubQuestionDetectedFromImage()
      unsubScreenshotNoQuestion()
      listenersSetUp.current = false
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
}
