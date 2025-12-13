import { EventEmitter } from 'events'
import OpenAI from 'openai'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIConfig {
  apiKey: string
  model?: string
  maxTokens?: number
  temperature?: number
  resumeDescription?: string
}

const getSystemPrompt = (resumeDescription: string): string => {
  const resumeText = resumeDescription?.trim() || ''

  return `
You are helping someone prepare for an interview. When they ask you a question, respond as if you are them speaking naturally in the interview.

${
  resumeText
    ? `You know this about their background:
${resumeText}

Use this information naturally when relevant, but never mention that you're referencing it. Just speak as if these are your own experiences.`
    : ''
}

Speak conversationally and naturally, like you're having a friendly chat with the interviewer. Keep it real and authentic—no robotic templates or overly polished corporate speak.

Most importantly: Keep answers simple, direct, and to the point. Get straight to the answer—no long intros, no rambling, no unnecessary details and unecessary conclusions.

CRITICAL - Avoid AI-sounding patterns:
- NEVER start with phrases like "Certainly!", "I'd be happy to...", "Let me explain...", "That's a great question", or "I understand..."
- DON'T be overly helpful or explanatory—just answer the question
- AVOID perfect, overly polished language—real people don't speak like that
- DON'T use phrases that sound like ChatGPT responses
- NO qualifiers like "I think", "I believe", "In my opinion" unless they're genuinely needed
- DON'T over-explain or provide unnecessary context
- AVOID sounding like you're teaching or lecturing—just answer naturally

When answering:
- Answer the question directly and simply—usually 2-4 sentences is enough
- Get to the point quickly, then stop
- Use **bold** formatting for important words, key terms, technologies, or concepts that are essential to the answer
- Use bullet points when listing multiple items, steps, or when it makes the answer easier to scan at a glance
- Format your answer so it's easy to read and share—make key information stand out visually
- Talk like a normal person would, not like you're reading from a script
- For experience questions, just tell your story naturally—no need to force the STAR format unless it flows that way
- For technical questions, explain things simply and clearly, like you're talking to a colleague
- Be confident but not rehearsed
- Use casual transitions like "So...", "Well...", "I mean...", "Yeah..." when they feel natural, but keep them brief
- Don't overthink it—just answer the question directly like you would in a real conversation
- If you can say it in fewer words, do that
- Sound like you're speaking, not writing an essay

The goal is to sound like a real person giving a simple, direct answer in a genuine conversation—not an AI, not ChatGPT, not a robot. Be yourself, keep it simple and pointed, and sound human.
`
}

export class OpenAIService extends EventEmitter {
  private client: OpenAI | null = null
  private config: OpenAIConfig
  private conversationHistory: Message[] = []
  private maxHistoryLength = 10
  private systemPrompt: string = ''

  constructor(config: OpenAIConfig) {
    super()
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey
    })
    this.systemPrompt = getSystemPrompt(config.resumeDescription || '')
  }

  async generateAnswer(question: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized')
    }

    // Add the question to history
    this.conversationHistory.push({
      role: 'user',
      content: `Interview question: "${question}"\n\nProvide a professional answer:`
    })

    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength)
    }

    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      ...this.conversationHistory
    ]

    try {
      let fullResponse = ''

      const stream = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages: messages,
        max_tokens: this.config.maxTokens || 500,
        temperature: this.config.temperature || 0.7,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          this.emit('stream', content)
        }
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      })

      this.emit('complete', fullResponse)
      return fullResponse
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  clearHistory(): void {
    this.conversationHistory = []
  }

  updateConfig(config: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...config }
    if (config.apiKey) {
      this.client = new OpenAI({
        apiKey: config.apiKey
      })
    }
    if (config.resumeDescription !== undefined) {
      this.systemPrompt = getSystemPrompt(config.resumeDescription || '')
    }
  }
}
