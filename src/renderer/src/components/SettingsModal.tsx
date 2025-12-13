import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Save, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AppSettings, useInterviewStore } from '../store/interviewStore'

interface ModelOption {
  id: string
  name: string
}

export function SettingsModal(): React.ReactNode | null {
  const { settings, showSettings, setShowSettings, setSettings } = useInterviewStore()
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [models, setModels] = useState<ModelOption[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // Fetch models when API key changes (with debounce)
  useEffect(() => {
    // Clear previous timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    const apiKey = localSettings.openaiApiKey?.trim()

    // If API key is empty, clear models and error
    if (!apiKey || apiKey.length === 0) {
      setModels([])
      setModelsError(null)
      setModelsLoading(false)
      return
    }

    // Debounce API call by 800ms
    setModelsLoading(true)
    setModelsError(null)

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await window.api.fetchOpenAIModels(apiKey)
        if (result.success) {
          setModels(result.models)
          setModelsError(null)

          // If current model is not in the list, set to first available model
          if (
            result.models.length > 0 &&
            !result.models.find((m) => m.id === localSettings.openaiModel)
          ) {
            setLocalSettings({ ...localSettings, openaiModel: result.models[0].id })
          }
        } else {
          setModelsError(result.error || 'Failed to fetch models')
          setModels([])
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models'
        setModelsError(errorMessage)
        setModels([])
      } finally {
        setModelsLoading(false)
      }
    }, 800)

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [localSettings.openaiApiKey])

  if (!showSettings) return null

  const handleSave = async (): Promise<void> => {
    try {
      setSaveStatus('saving')
      const updatedSettings = await window.api.updateSettings(localSettings)
      setSettings(updatedSettings as AppSettings)
      setSaveStatus('saved')
      setTimeout(() => {
        setSaveStatus('idle')
        setShowSettings(false)
      }, 1000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleOpacityChange = async (value: number): Promise<void> => {
    setLocalSettings({ ...localSettings, windowOpacity: value })
    await window.api.setWindowOpacity(value)
  }

  const handleClose = (): void => {
    setLocalSettings(settings)
    setShowSettings(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-dark-900 rounded-xl border border-dark-700 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-dark-100">Settings</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-dark-700 transition-colors text-dark-400 hover:text-dark-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-6 space-y-5 max-h-[32rem] overflow-y-auto custom-scrollbar">
          {/* OpenAI API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-200">
              OpenAI API Key
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs text-blue-400 hover:underline"
              >
                Get key →
              </a>
            </label>
            <p className="text-xs text-dark-500">
              Used for both speech-to-text and answer generation
            </p>
            <div className="relative">
              <input
                type={showOpenAIKey ? 'text' : 'password'}
                value={localSettings.openaiApiKey}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, openaiApiKey: e.target.value })
                }
                placeholder="Enter your OpenAI API key"
                className="w-full px-3 py-2 pr-10 bg-dark-800 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dark-400 hover:text-dark-200"
              >
                {showOpenAIKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* OpenAI Model */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-200">
              Answer Generation Model
            </label>
            {modelsLoading ? (
              <div className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                  <span className="text-sm text-dark-400">Loading models...</span>
                </div>
              </div>
            ) : modelsError ? (
              <div className="space-y-1">
                <select
                  value={localSettings.openaiModel}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, openaiModel: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-dark-800 border border-red-500/50 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fallback)</option>
                  <option value="gpt-4o">GPT-4o (Fallback)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo (Fallback)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fallback)</option>
                </select>
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle size={12} />
                  <span>{modelsError}</span>
                </div>
              </div>
            ) : models.length > 0 ? (
              <select
                value={localSettings.openaiModel}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, openaiModel: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={localSettings.openaiModel}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, openaiModel: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-blue-500 transition-colors"
                disabled
              >
                <option value="">Enter API key to load models</option>
              </select>
            )}
          </div>

          {/* Resume Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-200">Resume Description</label>
            <p className="text-xs text-dark-500">
              Paste your resume content here. This will be used to provide context-aware answers. Do
              not include icons, emojis, or other symbols.
            </p>
            <textarea
              value={localSettings.resumeDescription}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, resumeDescription: e.target.value })
              }
              placeholder="Enter your resume content here..."
              rows={8}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-blue-500 transition-colors resize-y"
            />
          </div>

          {/* Pause Threshold */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-200">
              Silence Detection
              <span className="ml-2 text-xs text-dark-400">{localSettings.pauseThreshold}ms</span>
            </label>
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={localSettings.pauseThreshold}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, pauseThreshold: Number(e.target.value) })
              }
              className="w-full accent-blue-500"
            />
            <p className="text-xs text-dark-500">
              How long to wait detecting the question for transcription (Recommended : 1500ms)
            </p>
          </div>

          {/* Window Opacity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-200">
              Window Opacity
              <span className="ml-2 text-xs text-dark-400">
                {Math.round(localSettings.windowOpacity * 100)}%
              </span>
            </label>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.05"
              value={localSettings.windowOpacity}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-dark-700">
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={16} />
              <span>Failed to save</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle size={16} />
              <span>Saved!</span>
            </div>
          )}
          {(saveStatus === 'idle' || saveStatus === 'saving') && <div />}

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-dark-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saveStatus === 'saving' ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
