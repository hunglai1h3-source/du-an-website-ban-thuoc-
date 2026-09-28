import type { ConfidenceLabel } from '../types'

export function scoreColor(score: number): string {
  if (score >= 85) return '#169873'
  if (score >= 60) return '#d79028'
  if (score > 0) return '#d95c59'
  return '#7c8795'
}

export function scoreLabel(score: number, blocked = false): ConfidenceLabel {
  if (blocked) return 'BLOCKED'
  if (score >= 85) return 'HIGH_OFFICIAL_MATCH'
  if (score >= 60) return 'REVIEW_REQUIRED'
  return 'INSUFFICIENT_EVIDENCE'
}

