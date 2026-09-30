import { useCallback, useEffect, useRef, useState } from 'react'
import { API_URL } from './api'

export type HealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'CHECKING'

export interface ServerHealthState {
  status: HealthStatus
  latencyMs: number | null
  lastChecked: Date | null
  checkHealth: () => Promise<void>
}

const POLL_INTERVAL_MS = 25000 // 25s polling
const SLOW_THRESHOLD_MS = 1000 // Latency >= 1s is considered degraded

export function useServerHealth(): ServerHealthState {
  const [status, setStatus] = useState<HealthStatus>('CHECKING')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const checkHealth = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const startTime = performance.now()
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      })
      const elapsed = Math.round(performance.now() - startTime)

      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        if (data.status === 'ok') {
          setLatencyMs(elapsed)
          setStatus(elapsed >= SLOW_THRESHOLD_MS ? 'DEGRADED' : 'ONLINE')
          setLastChecked(new Date())
          return
        }
      }
      setLatencyMs(elapsed)
      setStatus('DEGRADED')
      setLastChecked(new Date())
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setLatencyMs(null)
      setStatus('OFFLINE')
      setLastChecked(new Date())
    }
  }, [])

  useEffect(() => {
    checkHealth()
    const timer = setInterval(() => {
      checkHealth()
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [checkHealth])

  return { status, latencyMs, lastChecked, checkHealth }
}
