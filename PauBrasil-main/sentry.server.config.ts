import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://04dca7eabb4787cc556346a1f0ed1f3d@o4511213732626432.ingest.us.sentry.io/4511213739376640',

  // Tracing de server-side: 10% em produção
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  enabled: process.env.NODE_ENV === 'production',
})
