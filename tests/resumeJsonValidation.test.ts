import test from 'node:test'
import assert from 'node:assert/strict'

// Testing the validation logic that will be used in SettingsModal
export const getJsonValidationError = (str: string): string | null => {
  if (!str || !str.trim()) {
    return 'Resume JSON cannot be empty'
  }
  try {
    const parsed = JSON.parse(str)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return 'Resume JSON must be a valid JSON object'
    }
    return null
  } catch (err) {
    return (err as Error).message
  }
}

export const formatJson = (str: string): { formatted?: string; error?: string } => {
  const error = getJsonValidationError(str)
  if (error) {
    return { error }
  }
  try {
    const parsed = JSON.parse(str)
    return { formatted: JSON.stringify(parsed, null, 2) }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

test('getJsonValidationError validates valid JSON object', () => {
  const valid = JSON.stringify({ name: 'Candidate', skills: ['TypeScript'] })
  assert.equal(getJsonValidationError(valid), null)
})

test('getJsonValidationError detects invalid JSON syntax', () => {
  const invalid = '{ "name": "Candidate", '
  const error = getJsonValidationError(invalid)
  assert.ok(error !== null)
})

test('getJsonValidationError rejects empty or non-object JSON', () => {
  assert.equal(getJsonValidationError(''), 'Resume JSON cannot be empty')
  assert.equal(getJsonValidationError('   '), 'Resume JSON cannot be empty')
  assert.equal(getJsonValidationError('123'), 'Resume JSON must be a valid JSON object')
  assert.equal(getJsonValidationError('"just a string"'), 'Resume JSON must be a valid JSON object')
  assert.equal(getJsonValidationError('["array", "not", "object"]'), 'Resume JSON must be a valid JSON object')
})

test('formatJson correctly indents valid JSON with 2 spaces', () => {
  const compact = '{"name":"Candidate","skills":["TypeScript"]}'
  const result = formatJson(compact)
  assert.ok(result.formatted)
  assert.equal(result.formatted, '{\n  "name": "Candidate",\n  "skills": [\n    "TypeScript"\n  ]\n}')
})

test('formatJson returns error for malformed JSON without modifying input', () => {
  const malformed = '{"name":'
  const result = formatJson(malformed)
  assert.ok(result.error)
  assert.equal(result.formatted, undefined)
})
