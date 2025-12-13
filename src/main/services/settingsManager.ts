import { config } from 'dotenv'
import { app, safeStorage } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env file
config()

export interface AppSettings {
  openaiApiKey: string
  openaiModel: string
  alwaysOnTop: boolean
  windowOpacity: number
  pauseThreshold: number
  autoStart: boolean
  resumeDescription: string
}

// Load from environment variables if available
const getEnvApiKey = (key: string): string => {
  return process.env[key] || process.env[`VITE_${key}`] || ''
}

const DEFAULT_SETTINGS: AppSettings = {
  openaiApiKey: getEnvApiKey('OPENAI_API_KEY'),
  openaiModel: process.env.OPENAI_MODEL || process.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  alwaysOnTop: true,
  windowOpacity: 1.0,
  pauseThreshold: 1500,
  autoStart: false,
  resumeDescription: ''
}

export class SettingsManager {
  private settingsPath: string
  private settings: AppSettings

  constructor() {
    const userDataPath = app.getPath('userData')
    this.settingsPath = path.join(userDataPath, 'settings.json')
    this.settings = this.loadSettings()
  }

  private loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8')
        const savedSettings = JSON.parse(data)

        // Decrypt API keys if encryption is available
        if (safeStorage.isEncryptionAvailable()) {
          if (savedSettings.openaiApiKeyEncrypted) {
            try {
              savedSettings.openaiApiKey = safeStorage.decryptString(
                Buffer.from(savedSettings.openaiApiKeyEncrypted, 'base64')
              )
              delete savedSettings.openaiApiKeyEncrypted
            } catch {
              savedSettings.openaiApiKey = ''
            }
          }
        }

        return { ...DEFAULT_SETTINGS, ...savedSettings }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  private saveSettings(): void {
    try {
      const settingsToSave = { ...this.settings }

      // Encrypt API keys if encryption is available
      if (safeStorage.isEncryptionAvailable()) {
        if (settingsToSave.openaiApiKey) {
          ;(settingsToSave as Record<string, unknown>).openaiApiKeyEncrypted = safeStorage
            .encryptString(settingsToSave.openaiApiKey)
            .toString('base64')
          settingsToSave.openaiApiKey = ''
        }
      }

      fs.writeFileSync(this.settingsPath, JSON.stringify(settingsToSave, null, 2))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings }
  }

  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key]
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...updates }
    this.saveSettings()
  }

  setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value
    this.saveSettings()
  }

  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS }
    this.saveSettings()
  }

  hasApiKeys(): boolean {
    return Boolean(this.settings.openaiApiKey)
  }
}
