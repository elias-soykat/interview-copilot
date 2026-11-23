import test from 'node:test'
import assert from 'node:assert/strict'
import { getSystemPrompt } from '../src/main/services/openaiService.ts'

test('getSystemPrompt includes both job description and resume JSON with truthfulness rules', () => {
  const sampleJob = 'Senior Full Stack Engineer. Requirements: Node.js, TypeScript, Kafka.'
  const sampleResume = JSON.stringify({
    personal_information: { full_name: 'Test Candidate' },
    technical_skills: { languages: ['TypeScript'] }
  })

  const prompt = getSystemPrompt(sampleResume, sampleJob)

  // Must include Job Description section
  assert.ok(prompt.includes('TARGET JOB SPECIFICATION & REQUIREMENTS:'), 'Should have Job Description section header')
  assert.ok(prompt.includes(sampleJob), 'Should include the provided job description')
  assert.ok(prompt.includes('ALIGNMENT WITH JOB REQUIREMENTS:'), 'Should include job alignment instructions')

  // Must include Resume Description section
  assert.ok(prompt.includes('CANDIDATE BACKGROUND & RESUME (JSON FORMAT):'), 'Should have Resume JSON section header')
  assert.ok(prompt.includes(sampleResume), 'Should include the provided resume JSON')
  assert.ok(prompt.includes('STRICT TRUTHFULNESS & GROUNDING:'), 'Should include strict truthfulness instructions')
  assert.ok(prompt.includes('NEVER invent'), 'Should explicitly forbid inventing qualifications')
})

test('getSystemPrompt handles empty job description and empty resume gracefully', () => {
  const prompt = getSystemPrompt('', '')
  assert.ok(!prompt.includes('TARGET JOB SPECIFICATION & REQUIREMENTS:'), 'Should omit Job Description section when empty')
  assert.ok(!prompt.includes('CANDIDATE BACKGROUND & RESUME'), 'Should omit Resume section when empty')
  assert.ok(prompt.includes('CORE GOAL:'), 'Should maintain core interview rules')
})
