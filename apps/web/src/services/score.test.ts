import { describe, expect, it } from 'vitest'
import { scoreColor, scoreLabel } from './score'

describe('score presentation', () => {
  it('maps thresholds consistently with the backend rule labels', () => {
    expect(scoreLabel(85)).toBe('HIGH_OFFICIAL_MATCH')
    expect(scoreLabel(84)).toBe('REVIEW_REQUIRED')
    expect(scoreLabel(59)).toBe('INSUFFICIENT_EVIDENCE')
    expect(scoreLabel(100, true)).toBe('BLOCKED')
  })

  it('uses a neutral color for an empty score', () => {
    expect(scoreColor(0)).toBe('#7c8795')
  })
})

