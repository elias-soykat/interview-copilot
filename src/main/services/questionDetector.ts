import { EventEmitter } from 'events'

export interface DetectedQuestion {
  text: string
  confidence: number
  questionType: 'direct' | 'indirect' | 'rhetorical' | 'unknown'
}

// Question starter patterns
const QUESTION_STARTERS = [
  /^(what|when|where|who|whom|whose|which|why|how)\b/i,
  /^(can|could|would|will|shall|should|may|might|must)\s+you\b/i,
  /^(do|does|did)\s+(you|we|they)\b/i,
  /^(have|has)\s+(you|we|they)\b/i,
  /^(is|are|was|were)\s+(there|this|that|it|your)\b/i,
  /^(tell me|describe|explain|walk me through|give me|share)\b/i
]

// Question ending patterns
const QUESTION_ENDINGS = [/\?$/, /\b(right|correct)\s*\??\s*$/i]

// Common interview question patterns
const INTERVIEW_PATTERNS = [
  /tell me about (a time|your|the)/i,
  /why (do|did|should|would|are) you/i,
  /what (is|are|was|were) your/i,
  /what (is|are) the/i,
  /how (do|did|would|could|have) you/i,
  /describe (a time|a situation|a scenario|your|how)/i,
  /give (me )?(an )?example/i,
  /what (would|do|did) you (do|say|think|learn)/i,
  /where do you see yourself/i,
  /what (is|are) your (greatest )?(strength|weakness)/i,
  /why (are you|do you want|did you)/i,
  /what motivates you/i,
  /how do you handle/i,
  /tell me about a challenge/i,
  /what experience do you have/i,
  /can you (describe|explain|tell|give|walk)/i,
  /what (challenges|problems|issues)/i,
  /how (would|do) you (approach|solve|handle|deal)/i,
  /what (makes|made) you/i,
  /why (should|would) we/i,
  /what do you know about/i,
  /what are your (career|salary|long.term|short.term)/i,
  /do you have (any )?questions/i,
  /what (tools|technologies|languages|frameworks)/i,
  /have you (ever|worked|used|experienced)/i,

  // Technical interview patterns
  /difference between .+ and/i,
  /what happens when/i,
  /how does .+ work/i,
  /explain .+ in .+ words/i,
  /what is (the|a|an) .+ (in|for|with)/i,
  /when (would|should) you use/i,
  /pros and cons of/i,
  /advantages (of|and)/i,
  /trade.?offs (of|between)/i,
  /compare .+ (with|and|to|vs)/i,
  /what are (some|the) (best practices|common mistakes)/i,
  /how (can|do) you (optimize|improve|debug|test)/i,
  /what (design pattern|architecture|approach)/i,
  /walk me through (your|the|a)/i,
  /what is your (approach|process|methodology)/i,

  // System design patterns
  /how would you (design|build|architect|scale)/i,
  /what (database|cache|queue|service) would you/i,

  // Behavioral patterns
  /give me an example (of|when)/i,
  /how did you (handle|manage|resolve|approach)/i,
  /what was (the outcome|the result|your role)/i,
  /what did you learn from/i
]

// Common short phrases to IGNORE (not questions)
const IGNORE_PATTERNS = [
  /^(yes|no|yeah|yep|nope|okay|ok|sure|right|correct|exactly|absolutely|definitely|great|good|fine|thanks|thank you|bye|hello|hi|hey)[\s.,!?]*$/i,
  /^(mm+|uh+|um+|ah+|oh+|hmm+)[\s.,!?]*$/i,
  /^(I see|I understand|got it|makes sense|sounds good|no problem)[\s.,!?]*$/i,
  /^(see you|have a|take care|nice to|good to|pleasure).*$/i,
  /^(we'll|we will|let me|let's|I'll|I will).*$/i,
  /^(tell me about yourself).*$/i
]

export class QuestionDetector extends EventEmitter {
  private transcriptBuffer: string[] = []
  private minQuestionLength = 20 // Minimum characters for a valid question
  private minWordCount = 4 // Minimum words for a valid question
  private confidenceThreshold = 0.6 // Higher threshold for question detection
  private earlyDetectionThreshold = 0.8 // Higher threshold for early detection (without waiting)
  private lastEarlyDetection: string | null = null // Track last early detection to avoid duplicates

  constructor() {
    super()
  }

  addTranscript(text: string, isFinal: boolean): void {
    if (isFinal && text.trim()) {
      this.transcriptBuffer.push(text.trim())
    }
  }

  /**
   * Check for question immediately (early detection) - for high-confidence questions only
   * Returns the detected question if found, null otherwise
   */
  checkEarlyDetection(text: string): DetectedQuestion | null {
    const trimmedText = text.trim()

    // Skip if same as last early detection (prevent duplicates)
    if (this.lastEarlyDetection === trimmedText) {
      return null
    }

    // Check if text should be ignored
    if (this.shouldIgnore(trimmedText)) {
      return null
    }

    // Check minimum requirements
    const wordCount = trimmedText.split(/\s+/).length
    if (trimmedText.length < this.minQuestionLength || wordCount < this.minWordCount) {
      return null
    }

    const detection = this.analyzeQuestion(trimmedText)

    // Only trigger early if very high confidence
    if (detection.confidence >= this.earlyDetectionThreshold) {
      console.log(
        `[QuestionDetector] ⚡ EARLY DETECTION: "${trimmedText}" (confidence: ${detection.confidence.toFixed(2)})`
      )
      this.lastEarlyDetection = trimmedText
      return detection
    }

    return null
  }

  onUtteranceEnd(): void {
    const fullText = this.transcriptBuffer.join(' ').trim()

    // Clear buffer immediately
    this.transcriptBuffer = []

    // Skip if we already did early detection for this text
    if (this.lastEarlyDetection && fullText.includes(this.lastEarlyDetection)) {
      console.log(`[QuestionDetector] Skipping utterance end - already handled by early detection`)
      this.lastEarlyDetection = null
      return
    }

    // Reset early detection tracking
    this.lastEarlyDetection = null

    // Check if text should be ignored
    if (this.shouldIgnore(fullText)) {
      console.log(`[QuestionDetector] Ignored: "${fullText}"`)
      return
    }

    // Check minimum requirements
    const wordCount = fullText.split(/\s+/).length
    if (fullText.length < this.minQuestionLength || wordCount < this.minWordCount) {
      console.log(
        `[QuestionDetector] Too short (${fullText.length} chars, ${wordCount} words): "${fullText}"`
      )
      return
    }

    const detection = this.analyzeQuestion(fullText)
    console.log(
      `[QuestionDetector] Analyzed: "${fullText}" - Confidence: ${detection.confidence.toFixed(2)}, Type: ${detection.questionType}`
    )

    if (detection.confidence >= this.confidenceThreshold) {
      console.log(`[QuestionDetector] ✓ QUESTION DETECTED: "${fullText}"`)
      this.emit('questionDetected', detection)
    } else {
      console.log(`[QuestionDetector] ✗ Not a question (confidence too low)`)
    }
  }

  private shouldIgnore(text: string): boolean {
    for (const pattern of IGNORE_PATTERNS) {
      if (pattern.test(text)) {
        return true
      }
    }
    return false
  }

  private analyzeQuestion(text: string): DetectedQuestion {
    let confidence = 0
    let questionType: DetectedQuestion['questionType'] = 'unknown'

    // Check for question mark (highest confidence indicator)
    if (text.includes('?')) {
      confidence += 0.5
      questionType = 'direct'
    }

    // Check question starters
    for (const pattern of QUESTION_STARTERS) {
      if (pattern.test(text)) {
        confidence += 0.35
        if (questionType === 'unknown') questionType = 'direct'
        break
      }
    }

    // Check question endings
    for (const pattern of QUESTION_ENDINGS) {
      if (pattern.test(text)) {
        confidence += 0.15
        break
      }
    }

    // Check interview-specific patterns (strong indicator)
    for (const pattern of INTERVIEW_PATTERNS) {
      if (pattern.test(text)) {
        confidence += 0.4
        questionType = 'direct'
        break
      }
    }

    // Check for imperative interview requests (tell me, describe, explain)
    if (/^(tell|describe|explain|share|give|walk)\b/i.test(text)) {
      confidence += 0.3
      questionType = 'indirect'
    }

    // Boost confidence for longer, more complex sentences (likely real questions)
    const wordCount = text.split(/\s+/).length
    if (wordCount >= 8) {
      confidence += 0.1
    }
    if (wordCount >= 12) {
      confidence += 0.1
    }

    // Normalize confidence to max 1.0
    confidence = Math.min(confidence, 1.0)

    return {
      text,
      confidence,
      questionType
    }
  }

  // Manual check for question without waiting for utterance end
  isQuestion(text: string): boolean {
    if (this.shouldIgnore(text)) return false
    const detection = this.analyzeQuestion(text)
    return detection.confidence >= this.confidenceThreshold
  }

  clearBuffer(): void {
    this.transcriptBuffer = []
    this.lastEarlyDetection = null
  }

  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0.1, Math.min(1.0, threshold))
  }
}
