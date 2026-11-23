import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_RESUME_DESCRIPTION,
  DEFAULT_RESUME_OBJECT
} from '../src/main/services/defaultResume.ts'

test('DEFAULT_RESUME_DESCRIPTION is valid parsable JSON object', () => {
  assert.ok(typeof DEFAULT_RESUME_DESCRIPTION === 'string', 'Should be a string')
  assert.ok(DEFAULT_RESUME_DESCRIPTION.trim().length > 0, 'Should not be empty')

  const parsed = JSON.parse(DEFAULT_RESUME_DESCRIPTION)
  assert.ok(typeof parsed === 'object' && parsed !== null, 'Parsed resume should be an object')
  assert.ok(parsed.personal_information, 'Should have personal_information')
  assert.ok(parsed.technical_skills, 'Should have technical_skills')
  assert.ok(parsed.professional_experience, 'Should have professional_experience')
  assert.ok(Array.isArray(parsed.professional_experience), 'Experience should be an array')
  assert.deepEqual(parsed, DEFAULT_RESUME_OBJECT, 'Should match DEFAULT_RESUME_OBJECT')
})

test('Settings payload preserves jobDescription and resumeDescription', () => {
  const initialSettings = {
    openaiApiKey: 'sk-test-key-123',
    openaiModel: 'gpt-4o',
    alwaysOnTop: true,
    windowOpacity: 0.95,
    pauseThreshold: 1500,
    autoStart: false,
    resumeDescription: DEFAULT_RESUME_DESCRIPTION,
    jobDescription: 'Senior Software Engineer with Kafka and Node.js experience'
  }

  const serialized = JSON.stringify(initialSettings)
  const deserialized = JSON.parse(serialized)

  assert.equal(deserialized.jobDescription, initialSettings.jobDescription)
  assert.equal(deserialized.resumeDescription, initialSettings.resumeDescription)
  assert.equal(
    JSON.parse(deserialized.resumeDescription).personal_information.full_name,
    'Elias Soykat'
  )
})
