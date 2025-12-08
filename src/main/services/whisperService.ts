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
  chunkDurationMs?: number
}

export class WhisperService extends EventEmitter {
  private client: OpenAI
  private config: WhisperConfig
  private audioBuffer: Buffer[] = []
  private isProcessing = false
  private isRunning = false
  private processInterval: NodeJS.Timeout | null = null
  private lastProcessTime = 0
  private silenceStartTime = 0
  private readonly SAMPLE_RATE = 16000
  private readonly BYTES_PER_SAMPLE = 2 // 16-bit audio
  private readonly MIN_AUDIO_DURATION_MS = 1000 // Minimum 1 second of audio to process
  private readonly SILENCE_THRESHOLD_MS = 2000 // 2 seconds of silence before processing

  constructor(config: WhisperConfig) {
    super()
    this.config = config
    this.client = new OpenAI({ apiKey: config.apiKey })
  }

  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.audioBuffer = []
    this.lastProcessTime = Date.now()
    this.silenceStartTime = 0

    // Process audio every 100ms to check for silence/enough audio
    this.processInterval = setInterval(() => {
      this.checkAndProcess()
    }, 100)

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
      this.processAudioBuffer(true)
    }

    this.audioBuffer = []
    console.log('WhisperService stopped')
    this.emit('stopped')
  }

  addAudioData(audioData: Buffer | ArrayBuffer): void {
    if (!this.isRunning) return

    const buffer = audioData instanceof ArrayBuffer ? Buffer.from(audioData) : audioData
    this.audioBuffer.push(buffer)
  }

  private getBufferDurationMs(): number {
    const totalBytes = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0)
    const samples = totalBytes / this.BYTES_PER_SAMPLE
    return (samples / this.SAMPLE_RATE) * 1000
  }

  private checkAndProcess(): void {
    if (this.isProcessing || !this.isRunning) return

    const bufferDuration = this.getBufferDurationMs()
    const timeSinceLastProcess = Date.now() - this.lastProcessTime

    // Process if we have enough audio and enough time has passed (silence detection)
    const shouldProcess =
      bufferDuration >= this.MIN_AUDIO_DURATION_MS &&
      timeSinceLastProcess >= this.SILENCE_THRESHOLD_MS

    if (shouldProcess) {
      this.processAudioBuffer(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async processAudioBuffer(_isFinal?: boolean): Promise<void> {
    if (this.audioBuffer.length === 0 || this.isProcessing) return

    this.isProcessing = true

    // Combine all buffers
    const combinedBuffer = Buffer.concat(this.audioBuffer)
    this.audioBuffer = []
    this.lastProcessTime = Date.now()

    // Skip if audio is too short
    const durationMs = (combinedBuffer.length / this.BYTES_PER_SAMPLE / this.SAMPLE_RATE) * 1000
    if (durationMs < this.MIN_AUDIO_DURATION_MS) {
      this.isProcessing = false
      return
    }

    try {
      // Create WAV file from raw PCM data
      const wavBuffer = this.createWavBuffer(combinedBuffer)

      // Write to temp file (OpenAI API requires a file)
      const tempFile = path.join(os.tmpdir(), `whisper_${Date.now()}.wav`)
      fs.writeFileSync(tempFile, wavBuffer)

      console.log(`Processing ${Math.round(durationMs)}ms of audio...`)

      // Send to Whisper API
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: this.config.model || 'whisper-1',
        language: this.config.language || 'en',
        response_format: 'json'
      })

      // Clean up temp file
      fs.unlinkSync(tempFile)

      if (transcription.text && transcription.text.trim()) {
        console.log('Transcription:', transcription.text)

        const event: TranscriptEvent = {
          text: transcription.text.trim(),
          isFinal: true,
          confidence: 1.0
        }

        this.emit('transcript', event)

        // Emit utterance end for question detection
        this.emit('utteranceEnd')
      }
    } catch (error) {
      console.error('Whisper transcription error:', error)
      this.emit('error', error instanceof Error ? error : new Error('Transcription failed'))
    } finally {
      this.isProcessing = false
    }
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

  // Notify that speech has started (for UI feedback)
  notifySpeechStarted(): void {
    this.emit('speechStarted')
    this.silenceStartTime = 0
  }

  // Notify silence detected - trigger processing
  notifySilence(): void {
    if (this.silenceStartTime === 0) {
      this.silenceStartTime = Date.now()
    } else if (Date.now() - this.silenceStartTime >= this.SILENCE_THRESHOLD_MS) {
      // Enough silence, process the buffer
      if (this.audioBuffer.length > 0 && !this.isProcessing) {
        this.processAudioBuffer(false)
      }
    }
  }

  getIsRunning(): boolean {
    return this.isRunning
  }
}
