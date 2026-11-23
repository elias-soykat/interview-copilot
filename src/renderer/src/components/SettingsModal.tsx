import {
  AlertCircle,
  CheckCircle,
  Code,
  Coffee,
  Eye,
  EyeOff,
  Loader2,
  Mic,
  RotateCcw,
  Save,
  Trash2,
  X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_RESUME_DESCRIPTION } from '../constants/defaultResume'
import { SAMPLE_JOB_DESCRIPTION } from '../constants/defaultJobDescription'
import { AppSettings, useInterviewStore } from '../store/interviewStore'

interface ModelOption {
  id: string
  name: string
}

const DEFAULT_MODELS: ModelOption[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Default)' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'o1-mini', name: 'o1-mini' },
  { id: 'o3-mini', name: 'o3-mini' }
]

function getResumeJsonError(text: string): string | null {
  if (!text || !text.trim()) {
    return 'Resume JSON cannot be empty'
  }
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return 'Resume JSON must be a valid JSON object'
    }
    return null
  } catch (err) {
    return (err as Error).message
  }
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

  const [prevSettings, setPrevSettings] = useState(settings)
  if (settings !== prevSettings) {
    setPrevSettings(settings)
    setLocalSettings(settings)
  }

  const resumeJsonError = useMemo(
    () => getResumeJsonError(localSettings.resumeDescription),
    [localSettings.resumeDescription]
  )

  // Fetch models when API key changes (with debounce)
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    const apiKey = localSettings.openaiApiKey?.trim()

    fetchTimeoutRef.current = setTimeout(async () => {
      if (!apiKey || apiKey.length === 0) {
        setModels([])
        setModelsError(null)
        setModelsLoading(false)
        return
      }

      setModelsLoading(true)
      setModelsError(null)

      try {
        const result = await window.api.fetchOpenAIModels(apiKey)
        if (result.success) {
          setModels(result.models)
          setModelsError(null)

          setLocalSettings((prev) => {
            if (result.models.length > 0 && !result.models.find((m) => m.id === prev.openaiModel)) {
              return { ...prev, openaiModel: result.models[0].id }
            }
            return prev
          })
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

  const displayModels =
    models.length > 0
      ? models
      : DEFAULT_MODELS.some((m) => m.id === localSettings.openaiModel) || !localSettings.openaiModel
        ? DEFAULT_MODELS
        : [{ id: localSettings.openaiModel, name: localSettings.openaiModel }, ...DEFAULT_MODELS]

  const handleSave = async (): Promise<void> => {
    if (resumeJsonError) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
      return
    }

    try {
      setSaveStatus('saving')
      const updatedLocalSettings = {
        ...localSettings,
        openaiModel: localSettings.openaiModel || 'gpt-4o-mini'
      }
      const updatedSettings = await window.api.updateSettings(updatedLocalSettings)
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

  const handleFormatResume = (): void => {
    try {
      const parsed = JSON.parse(localSettings.resumeDescription)
      setLocalSettings((prev) => ({
        ...prev,
        resumeDescription: JSON.stringify(parsed, null, 2)
      }))
    } catch {
      // Ignore if invalid
    }
  }

  const handleResetResume = (): void => {
    setLocalSettings((prev) => ({
      ...prev,
      resumeDescription: DEFAULT_RESUME_DESCRIPTION
    }))
  }

  const handleLoadSampleJob = (): void => {
    setLocalSettings((prev) => ({
      ...prev,
      jobDescription: SAMPLE_JOB_DESCRIPTION
    }))
  }

  const handleClearJob = (): void => {
    setLocalSettings((prev) => ({
      ...prev,
      jobDescription: ''
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-dark-900 rounded-xl border border-dark-700 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Mic className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-dark-100">Settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-dark-700 transition-colors text-dark-400 hover:text-dark-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
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
            ) : (
              <div className="space-y-1">
                <select
                  value={localSettings.openaiModel || 'gpt-4o-mini'}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, openaiModel: e.target.value })
                  }
                  className={`w-full px-3 py-2 bg-dark-800 border ${
                    modelsError
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-dark-600 focus:border-blue-500'
                  } rounded-lg text-sm text-dark-100 focus:outline-none transition-colors`}
                >
                  {displayModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                {modelsError ? (
                  <div className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle size={12} />
                    <span>{modelsError}</span>
                  </div>
                ) : !localSettings.openaiApiKey?.trim() ? (
                  <p className="text-xs text-dark-500">
                    Default models shown. Enter an API key to load all models from your OpenAI
                    account.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* 1. Job Description / Role Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-dark-200">
                Job Description / Role Description
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleJob}
                  className="px-2 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-dark-200 rounded border border-dark-600 transition-colors"
                >
                  Load Sample Spec
                </button>
                {localSettings.jobDescription?.trim() && (
                  <button
                    type="button"
                    onClick={handleClearJob}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-dark-800 hover:bg-red-500/20 text-dark-400 hover:text-red-400 rounded border border-dark-600 transition-colors"
                    title="Clear job description"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-dark-400">
              Paste any job description or role requirements here. Generated answers will be
              targeted to these expectations.
            </p>
            <textarea
              value={localSettings.jobDescription}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, jobDescription: e.target.value })
              }
              placeholder="Paste any job description here (e.g. key responsibilities, required technical skills, qualifications, level)..."
              rows={6}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* 2. Resume Description (JSON) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-dark-200">
                  Resume Description (JSON)
                </label>
                {resumeJsonError ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-950/60 border border-red-800/80 text-red-400">
                    <AlertCircle size={12} />
                    Invalid JSON
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
                    <CheckCircle size={12} />
                    Valid JSON
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFormatResume}
                  disabled={!!resumeJsonError}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-dark-700 hover:bg-dark-600 disabled:opacity-40 disabled:hover:bg-dark-700 text-dark-200 rounded border border-dark-600 transition-colors"
                  title="Format JSON with 2 spaces indentation"
                >
                  <Code size={12} />
                  <span>Format JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetResume}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-dark-200 rounded border border-dark-600 transition-colors"
                  title="Reset to default structured JSON resume"
                >
                  <RotateCcw size={12} />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-dark-400">
              Provide your resume in JSON format. The AI strictly references these skills, projects,
              and metrics without inventing unlisted experience.
            </p>
            {resumeJsonError && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-800/50 text-xs text-red-300">
                <span className="font-semibold">JSON Syntax Error:</span> {resumeJsonError}
              </div>
            )}
            <textarea
              value={localSettings.resumeDescription}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, resumeDescription: e.target.value })
              }
              placeholder="Paste your structured resume JSON here..."
              rows={9}
              className={`w-full px-3 py-2 bg-dark-800 font-mono text-xs border ${
                resumeJsonError
                  ? 'border-red-500/70 focus:border-red-500'
                  : 'border-dark-600 focus:border-blue-500'
              } rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none transition-colors resize-y leading-relaxed`}
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
              How long to wait detecting the question for transcription (Recommended: 1500ms)
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
        <div className="flex items-center justify-between px-5 py-4 border-t border-dark-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Coffee size={16} />
              <span>Buy me a coffee</span>
            </a>
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle size={16} />
                <span>{resumeJsonError ? 'Fix JSON error to save' : 'Failed to save'}</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle size={16} />
                <span>Saved!</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {resumeJsonError && (
              <span className="text-xs text-red-400 hidden sm:inline">
                Fix JSON errors before saving
              </span>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-dark-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving' || !!resumeJsonError}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
