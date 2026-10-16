import { useCallback } from 'react'
import { analytics, type AnalyticsProperties } from '@/lib/analytics'

/**
 * Hook conveniente para tracking de eventos — memoriza a referência de `track`
 * para evitar re-renders desnecessários em dependências de useEffect.
 */
export function useAnalytics() {
  const track = useCallback((event: string, props?: AnalyticsProperties) => {
    analytics.track(event, props)
  }, [])

  return { track }
}
