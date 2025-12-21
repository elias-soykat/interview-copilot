import { useEffect, useRef } from 'react'
import { useInterviewStore } from '../store/interviewStore'

const TEN_MINUTES_MS = 10 * 60 * 1000 // 10 minutes in milliseconds
const ONE_MINUTE_MS = 60 * 1000 // 1 minute in milliseconds

export function useSessionTimer(): void {
  const { isSessionActive, sessionStartTime, updateSessionTime, endSession } = useInterviewStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const apiCalledRef = useRef<boolean>(false)

  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) {
      // Clear interval if session is not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      apiCalledRef.current = false
      return
    }

    // Calculate initial elapsed time
    const initialElapsed = Date.now() - sessionStartTime
    updateSessionTime(initialElapsed)

    // Check if 10 minutes already passed
    if (initialElapsed >= TEN_MINUTES_MS && !apiCalledRef.current) {
      callSessionApi(initialElapsed)
      apiCalledRef.current = true
    }

    // Set up interval to update every minute
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime
      updateSessionTime(elapsed)

      // Check if 10 minutes have passed
      if (elapsed >= TEN_MINUTES_MS && !apiCalledRef.current) {
        callSessionApi(elapsed)
        apiCalledRef.current = true
      }
    }, ONE_MINUTE_MS)

    // Cleanup on unmount or when session ends
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isSessionActive, sessionStartTime, updateSessionTime, endSession])

  // Reset API called flag when session ends
  useEffect(() => {
    if (!isSessionActive) {
      apiCalledRef.current = false
    }
  }, [isSessionActive])
}

async function callSessionApi(elapsedTimeMs: number): Promise<void> {
  try {
    const durationMinutes = Math.floor(elapsedTimeMs / ONE_MINUTE_MS)
    const payload = {
      sessionDuration: durationMinutes,
      timestamp: Date.now()
    }

    await window.api.callSessionApi(payload)
    console.log('Session API called successfully after 10 minutes')
  } catch (error) {
    console.error('Failed to call session API:', error)
  }
}
