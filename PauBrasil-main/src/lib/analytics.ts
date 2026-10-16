/**
 * src/lib/analytics.ts
 *
 * Shim agnóstico de provider — suporta PostHog, Google Analytics 4 ou no-op.
 * Troca de provider sem tocar nos componentes.
 *
 * Para ativar PostHog: instale posthog-js e inicialize em _app ou layout.tsx.
 * Para ativar GA4: adicione o script gtag via next/script no layout.tsx.
 * Em desenvolvimento: eventos são logados no console.debug.
 */

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>

function getProvider() {
  if (typeof window === 'undefined') return null

  // PostHog
  const ph = (window as any).posthog
  if (ph?.capture) {
    return {
      track:    (e: string, p?: AnalyticsProperties) => ph.capture(e, p),
      identify: (id: string, traits?: AnalyticsProperties) => ph.identify(id, traits),
    }
  }

  // Google Analytics 4
  const gtag = (window as any).gtag
  if (typeof gtag === 'function') {
    return {
      track:    (e: string, p?: AnalyticsProperties) => gtag('event', e, p),
      identify: (_id: string, _traits?: AnalyticsProperties) => {},
    }
  }

  // No-op com log em desenvolvimento
  return {
    track: (e: string, p?: AnalyticsProperties) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', e, p ?? '')
      }
    },
    identify: (_id: string, _traits?: AnalyticsProperties) => {},
  }
}

export const analytics = {
  /**
   * Dispara um evento de tracking.
   * No-op em SSR (typeof window === 'undefined').
   */
  track(event: string, props?: AnalyticsProperties): void {
    getProvider()?.track(event, props)
  },

  /**
   * Associa eventos futuros a um usuário identificado.
   * Chamar após login bem-sucedido.
   */
  identify(userId: string, traits?: AnalyticsProperties): void {
    getProvider()?.identify(userId, traits)
  },
}
