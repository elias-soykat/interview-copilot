import { useCallback, useRef, useState } from 'react'
import { AudioCaptureService } from '../services/audioCapture'

export type AudioSource = 'microphone' | 'system'

interface UseAudioCaptureReturn {
  isCapturing: boolean
  error: string | null
  audioSource: AudioSource
  startCapture: (source?: AudioSource, sourceId?: string) => Promise<void>
  stopCapture: () => Promise<void>
  setAudioSource: (source: AudioSource) => void
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioSource, setAudioSource] = useState<AudioSource>('system')
  const audioServiceRef = useRef<AudioCaptureService | null>(null)

  const startCapture = useCallback(
    async (source: AudioSource = audioSource, sourceId?: string) => {
      try {
        setError(null)

        // Start backend capture service first
        await window.api.startCapture()

        // Create and start audio capture
        audioServiceRef.current = new AudioCaptureService({
          sampleRate: 16000,
          channelCount: 1
        })

        if (source === 'system') {
          // Get available audio sources
          const sources = await window.api.getAudioSources()

          if (sources.length === 0) {
            throw new Error('No audio sources available. Please share your screen first.')
          }

          // Use provided sourceId or find the best source
          let targetSourceId = sourceId

          if (!targetSourceId) {
            // Try to find the entire screen source first
            const screenSource = sources.find(
              (s) =>
                s.name.toLowerCase().includes('entire screen') ||
                s.name.toLowerCase().includes('screen 1') ||
                s.name.toLowerCase() === 'screen'
            )

            if (screenSource) {
              targetSourceId = screenSource.id
            } else {
              // Fall back to first available source
              targetSourceId = sources[0].id
            }
          }

          console.log('Starting system audio capture with source:', targetSourceId)
          await audioServiceRef.current.startSystemAudioCapture(targetSourceId)
        } else {
          console.log('Starting microphone capture')
          await audioServiceRef.current.startMicrophoneCapture()
        }

        setIsCapturing(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start capture'
        setError(message)
        console.error('Audio capture error:', err)

        // Clean up on error
        if (audioServiceRef.current) {
          await audioServiceRef.current.stop()
          audioServiceRef.current = null
        }

        try {
          await window.api.stopCapture()
        } catch {
          // Ignore stop errors
        }
      }
    },
    [audioSource]
  )

  const stopCapture = useCallback(async () => {
    try {
      // Stop audio capture
      if (audioServiceRef.current) {
        await audioServiceRef.current.stop()
        audioServiceRef.current = null
      }

      // Stop backend service
      await window.api.stopCapture()

      setIsCapturing(false)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop capture'
      setError(message)
      console.error('Stop capture error:', err)
    }
  }, [])

  return {
    isCapturing,
    error,
    audioSource,
    startCapture,
    stopCapture,
    setAudioSource
  }
}
