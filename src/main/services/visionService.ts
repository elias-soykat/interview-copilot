import OpenAI from 'openai'

export interface VisionAnalysisResult {
  isQuestion: boolean
  questionText?: string
  questionType?: 'leetcode' | 'system-design' | 'other'
  confidence?: number
}

export interface VisionServiceConfig {
  apiKey: string
  model?: string
}

/**
 * Service to analyze screenshots for interview questions using OpenAI Vision API
 */
export class VisionService {
  private client: OpenAI
  private config: VisionServiceConfig

  constructor(config: VisionServiceConfig) {
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey
    })
  }

  /**
   * Analyzes a screenshot to detect if it contains an interview question
   * @param imageBase64 Base64 encoded image data URL
   * @returns Analysis result with question detection
   */
  async analyzeScreenshot(imageBase64: string): Promise<VisionAnalysisResult> {
    try {
      // Remove data URL prefix if present
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64

      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing screenshots to detect interview questions. 
Your task is to determine if the screenshot contains:
1. A LeetCode coding problem (algorithm/data structure questions, programming challenges)
2. A system design problem (architecture, scalability, distributed systems, design questions)
3. Any other technical interview question (coding, algorithms, data structures, technical problems)

IMPORTANT: Be lenient in detection. If you see ANY coding problem, algorithm question, programming challenge, or technical problem, consider it an interview question.

You MUST respond ONLY with valid JSON in this exact format:
{
  "isQuestion": true/false,
  "questionText": "full question text if detected, otherwise empty string",
  "questionType": "leetcode" | "system-design" | "other",
  "confidence": 0.0-1.0
}

If you see any coding problem, algorithm, or technical question, set isQuestion to true and extract the question text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this screenshot carefully. Look for:
- Coding problems or programming challenges
- Algorithm questions
- Data structure problems  
- System design questions
- Any technical interview questions

If you find ANY of these, respond with JSON where isQuestion=true and include the full question text. Be thorough - extract all visible text that appears to be a question or problem statement.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 1000,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        console.log('Vision API returned empty content')
        return {
          isQuestion: false,
          confidence: 0
        }
      }

      console.log('Vision API response:', content.substring(0, 200))

      // Try to parse JSON response
      try {
        // Clean up the content - remove markdown code blocks if present
        let cleanedContent = content.trim()
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```\n?/g, '').replace(/```\n?/g, '')
        }

        const parsed = JSON.parse(cleanedContent)
        console.log('Parsed vision result:', {
          isQuestion: parsed.isQuestion,
          hasQuestionText: !!parsed.questionText,
          questionType: parsed.questionType,
          confidence: parsed.confidence
        })

        const result = {
          isQuestion: parsed.isQuestion === true || parsed.isQuestion === 'true',
          questionText: parsed.questionText || parsed.question_text || '',
          questionType: parsed.questionType || parsed.question_type || 'other',
          confidence: parsed.confidence || 0.5
        }

        // If we have question text, consider it a valid question even if isQuestion is false
        if (result.questionText && result.questionText.trim().length > 10) {
          result.isQuestion = true
          if (result.confidence < 0.5) {
            result.confidence = 0.7
          }
        }

        return result
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        console.log('Raw content:', content)

        // If not JSON, try to extract information from text
        const lowerContent = content.toLowerCase()
        const isQuestion =
          lowerContent.includes('leetcode') ||
          lowerContent.includes('system design') ||
          lowerContent.includes('coding problem') ||
          lowerContent.includes('algorithm') ||
          lowerContent.includes('interview question') ||
          lowerContent.includes('programming') ||
          lowerContent.includes('function') ||
          lowerContent.includes('array') ||
          lowerContent.includes('string') ||
          lowerContent.includes('tree') ||
          lowerContent.includes('graph') ||
          lowerContent.includes('design') ||
          lowerContent.includes('implement')

        // Try to extract question text from the response
        let extractedText = ''
        if (isQuestion) {
          // Try to find text that looks like a question
          const lines = content.split('\n')
          extractedText = lines
            .filter((line) => line.trim().length > 20)
            .slice(0, 5)
            .join(' ')
            .substring(0, 500)
        }

        return {
          isQuestion,
          questionText: extractedText || undefined,
          questionType: 'other' as const,
          confidence: isQuestion ? 0.6 : 0.2
        }
      }
    } catch (error) {
      console.error('Vision analysis error:', error)
      throw error
    }
  }
}
