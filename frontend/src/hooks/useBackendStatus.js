import { useEffect, useState } from 'react'

export function useBackendStatus() {
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const response = await fetch('/api/health/')

        if (!response.ok) {
          throw new Error('Failed to reach the backend.')
        }

        const data = await response.json()

        if (!cancelled) {
          setPayload(data)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const status = loading
    ? { label: 'Checking API', dotClass: 'bg-amber-300 animate-pulse' }
    : error
      ? { label: 'Backend offline', dotClass: 'bg-rose-400' }
      : { label: 'Backend online', dotClass: 'bg-emerald-400' }

  return { error, loading, payload, status }
}
