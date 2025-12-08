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
}

const SYSTEM_PROMPT = `You are an expert interview coach helping a candidate answer interview questions in real-time. Your role is to provide concise, professional, and impressive answers.

Guidelines:
1. Keep answers concise but comprehensive (2-4 sentences for simple questions, up to 6-8 for complex ones)
2. Use the STAR method (Situation, Task, Action, Result) for behavioral questions
3. Be specific with examples when possible
4. Maintain a confident and professional tone
5. For technical questions, provide accurate and clear explanations
6. Avoid filler words and unnecessary qualifiers
7. Structure answers logically
8. Highlight relevant skills and achievements

Format your responses to be easily readable and speakable. Use bullet points only when listing multiple items. Do not include any meta-commentary about the answer - just provide the answer itself.`

export class OpenAIService extends EventEmitter {
  private client: OpenAI | null = null
  private config: OpenAIConfig
  private conversationHistory: Message[] = []
  private maxHistoryLength = 10

  constructor(config: OpenAIConfig) {
    super()
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey
    })
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
      { role: 'system', content: SYSTEM_PROMPT },
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
  }
}
