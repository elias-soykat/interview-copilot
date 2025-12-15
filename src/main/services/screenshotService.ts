import { BrowserWindow, desktopCapturer } from 'electron'

export interface ScreenshotResult {
  success: boolean
  imageData?: string // base64 data URL
  error?: string
}

/**
 * Service to capture screenshots of the active window
 */
export class ScreenshotService {
  private appWindowTitle?: string

  constructor(appWindow?: BrowserWindow) {
    // Get the app window title to exclude it from capture
    if (appWindow) {
      this.appWindowTitle = appWindow.getTitle()
    }
  }

  /**
   * Captures the currently active/focused window (excluding the AI assistant app)
   * @returns Base64 encoded image data URL
   */
  async captureActiveWindow(): Promise<ScreenshotResult> {
    try {
      // Get all available sources (windows and screens)
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 1920, height: 1080 }, // High quality
        fetchWindowIcons: false
      })

      if (sources.length === 0) {
        return {
          success: false,
          error: 'No windows available to capture'
        }
      }

      console.log(
        'Available windows:',
        sources.map((s) => s.name)
      )

      // Filter out the AI assistant app window
      // Common patterns: "Interview Copilot", "interview-copilot", etc.
      const appWindowPatterns = [
        'Interview Copilot',
        'interview-copilot',
        'interview',
        'electron',
        this.appWindowTitle?.toLowerCase() || ''
      ].filter(Boolean)

      const filteredSources = sources.filter((source) => {
        const sourceNameLower = source.name.toLowerCase()
        // Exclude if it matches any app window pattern
        const isAppWindow = appWindowPatterns.some((pattern) => {
          if (!pattern) return false
          return sourceNameLower.includes(pattern) || sourceNameLower === pattern
        })

        // Also exclude if it's clearly an Electron dev window
        const isElectronDev =
          sourceNameLower.includes('electron') &&
          (sourceNameLower.includes('devtools') || sourceNameLower.includes('dev tools'))

        return !isAppWindow && !isElectronDev
      })

      if (filteredSources.length === 0) {
        return {
          success: false,
          error:
            'No other windows available to capture. Please open a browser or another application.'
        }
      }

      // Prioritize browser windows
      const browserKeywords = ['chrome', 'edge', 'firefox', 'safari', 'opera', 'brave', 'browser']
      const browserSource = filteredSources.find((source) => {
        const nameLower = source.name.toLowerCase()
        return browserKeywords.some((keyword) => nameLower.includes(keyword))
      })

      // If we found a browser, use it; otherwise use the first non-app window
      const activeSource = browserSource || filteredSources[0]

      console.log('Capturing window:', activeSource.name)

      if (!activeSource || !activeSource.thumbnail) {
        return {
          success: false,
          error: 'Failed to capture window thumbnail'
        }
      }

      // Convert native image to base64 data URL
      const image = activeSource.thumbnail
      const imageDataUrl = image.toDataURL()

      return {
        success: true,
        imageData: imageDataUrl
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Screenshot capture error:', errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Captures a specific window by name
   * @param windowName Name or partial name of the window to capture
   * @returns Base64 encoded image data URL
   */
  async captureWindowByName(windowName: string): Promise<ScreenshotResult> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 1920, height: 1080 },
        fetchWindowIcons: false
      })

      const matchingSource = sources.find((source) =>
        source.name.toLowerCase().includes(windowName.toLowerCase())
      )

      if (!matchingSource || !matchingSource.thumbnail) {
        return {
          success: false,
          error: `Window "${windowName}" not found`
        }
      }

      const image = matchingSource.thumbnail
      const imageDataUrl = image.toDataURL()

      return {
        success: true,
        imageData: imageDataUrl
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Screenshot capture error:', errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }
}
