import { EventEmitter } from 'events'
import * as fs from 'fs'
import OpenAI from 'openai'
import * as os from 'os'
import * as path from 'path'

export interface TranscriptEvent {
  text: string
  isFinal: boolean
  confidence: number
}

export interface WhisperConfig {
  apiKey: string
  model?: string
  language?: string
}

export class WhisperService extends EventEmitter {
  private client: OpenAI
  private config: WhisperConfig
  private audioBuffer: Buffer[] = []
  private isProcessing = false
  private isRunning = false
  private processInterval: NodeJS.Timeout | null = null
  private lastAudioTime = 0
  private readonly SAMPLE_RATE = 16000
  private readonly BYTES_PER_SAMPLE = 2 // 16-bit audio
  private readonly MIN_AUDIO_DURATION_MS = 2000 // Minimum 2 seconds of audio
  private readonly SILENCE_THRESHOLD_MS = 3000 // 3 seconds of silence before processing
  private readonly MAX_BUFFER_DURATION_MS = 30000 // Max 30 seconds before forced processing

  constructor(config: WhisperConfig) {
    super()
    this.config = config
    this.client = new OpenAI({ apiKey: config.apiKey })
  }

  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.audioBuffer = []
    this.lastAudioTime = Date.now()

    // Check for silence every 500ms
    this.processInterval = setInterval(() => {
      this.checkAndProcess()
    }, 500)

    console.log('WhisperService started')
    this.emit('started')
  }

  stop(): void {
    this.isRunning = false

    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }

    // Process any remaining audio
    if (this.audioBuffer.length > 0) {
      this.processAudioBuffer()
    }

    this.audioBuffer = []
    console.log('WhisperService stopped')
    this.emit('stopped')
  }

  addAudioData(audioData: Buffer | ArrayBuffer): void {
    if (!this.isRunning) return

    const buffer = audioData instanceof ArrayBuffer ? Buffer.from(audioData) : audioData

    // Check if this chunk has actual audio (not silence)
    if (this.hasAudio(buffer)) {
      this.audioBuffer.push(buffer)
      this.lastAudioTime = Date.now()
    }
  }

  // Check if audio buffer contains actual sound (not silence)
  private hasAudio(buffer: Buffer): boolean {
    // Calculate RMS (root mean square) to detect if there's actual audio
    let sum = 0
    const samples = buffer.length / this.BYTES_PER_SAMPLE

    for (let i = 0; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i)
      sum += sample * sample
    }

    const rms = Math.sqrt(sum / samples)
    // Threshold for considering it as actual audio vs silence
    return rms > 500
  }

  private getBufferDurationMs(): number {
    const totalBytes = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0)
    const samples = totalBytes / this.BYTES_PER_SAMPLE
    return (samples / this.SAMPLE_RATE) * 1000
  }

  private checkAndProcess(): void {
    if (this.isProcessing || !this.isRunning) return

    const bufferDuration = this.getBufferDurationMs()
    const timeSinceLastAudio = Date.now() - this.lastAudioTime

    // Process if:
    // 1. We have enough audio AND enough silence has passed
    // 2. OR buffer is getting too large (force process)
    const hasEnoughAudio = bufferDuration >= this.MIN_AUDIO_DURATION_MS
    const hasSilence = timeSinceLastAudio >= this.SILENCE_THRESHOLD_MS
    const bufferTooLarge = bufferDuration >= this.MAX_BUFFER_DURATION_MS

    if ((hasEnoughAudio && hasSilence) || bufferTooLarge) {
      console.log(
        `Processing: ${Math.round(bufferDuration)}ms audio, ${Math.round(timeSinceLastAudio)}ms since last audio`
      )
      this.processAudioBuffer()
    }
  }

  private async processAudioBuffer(): Promise<void> {
    if (this.audioBuffer.length === 0 || this.isProcessing) return

    this.isProcessing = true

    // Combine all buffers
    const combinedBuffer = Buffer.concat(this.audioBuffer)
    this.audioBuffer = []

    // Skip if audio is too short
    const durationMs = (combinedBuffer.length / this.BYTES_PER_SAMPLE / this.SAMPLE_RATE) * 1000
    if (durationMs < this.MIN_AUDIO_DURATION_MS) {
      console.log(`Skipping: audio too short (${Math.round(durationMs)}ms)`)
      this.isProcessing = false
      return
    }

    try {
      // Create WAV file from raw PCM data
      const wavBuffer = this.createWavBuffer(combinedBuffer)

      // Write to temp file (OpenAI API requires a file)
      const tempFile = path.join(os.tmpdir(), `whisper_${Date.now()}.wav`)
      fs.writeFileSync(tempFile, wavBuffer)

      console.log(`Sending ${Math.round(durationMs)}ms of audio to Whisper...`)

      // Send to Whisper API
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: this.config.model || 'whisper-1',
        language: this.config.language || 'en',
        response_format: 'json'
      })

      // Clean up temp file
      fs.unlinkSync(tempFile)

      const text = transcription.text?.trim()

      if (text && text.length > 0) {
        // Filter out common noise transcriptions
        if (this.isNoise(text)) {
          console.log(`Filtered noise: "${text}"`)
        } else {
          console.log(`Transcription: "${text}"`)

          const event: TranscriptEvent = {
            text: text,
            isFinal: true,
            confidence: 1.0
          }

          this.emit('transcript', event)
          this.emit('utteranceEnd')
        }
      }
    } catch (error) {
      console.error('Whisper transcription error:', error)
      this.emit('error', error instanceof Error ? error : new Error('Transcription failed'))
    } finally {
      this.isProcessing = false
    }
  }

  // Filter out common noise/hallucination from Whisper
  private isNoise(text: string): boolean {
    const noisePatterns = [
      /^you+\.?$/i,
      /^\.+$/,
      /^[,.\s]+$/,
      /^(um+|uh+|ah+|oh+|hmm+)\.?$/i,
      /^(bye|hi|hello|hey)\.?$/i,
      /^thank(s| you)\.?$/i,
      /^okay\.?$/i,
      /^(yes|no|yeah|yep|nope)\.?$/i,
      /^good\.?$/i,
      /^right\.?$/i,
      /^(subs|subtitles) by/i,
      /^www\./i,
      /^\[.*\]$/, // [Music], [Applause], etc.
      /^♪.*♪$/
    ]

    for (const pattern of noisePatterns) {
      if (pattern.test(text.trim())) {
        return true
      }
    }

    // Filter out very short text (less than 3 words)
    const wordCount = text.split(/\s+/).length
    if (wordCount < 3) {
      return true
    }

    return false
  }

  private createWavBuffer(pcmData: Buffer): Buffer {
    // WAV header for 16-bit mono PCM at 16kHz
    const numChannels = 1
    const sampleRate = this.SAMPLE_RATE
    const bitsPerSample = 16
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
    const blockAlign = numChannels * (bitsPerSample / 8)
    const dataSize = pcmData.length
    const headerSize = 44

    const header = Buffer.alloc(headerSize)

    // RIFF header
    header.write('RIFF', 0)
    header.writeUInt32LE(dataSize + headerSize - 8, 4)
    header.write('WAVE', 8)

    // fmt chunk
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16) // Subchunk1Size for PCM
    header.writeUInt16LE(1, 20) // AudioFormat (1 = PCM)
    header.writeUInt16LE(numChannels, 22)
    header.writeUInt32LE(sampleRate, 24)
    header.writeUInt32LE(byteRate, 28)
    header.writeUInt16LE(blockAlign, 32)
    header.writeUInt16LE(bitsPerSample, 34)

    // data chunk
    header.write('data', 36)
    header.writeUInt32LE(dataSize, 40)

    return Buffer.concat([header, pcmData])
  }

  getIsRunning(): boolean {
    return this.isRunning
  }
}
