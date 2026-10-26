/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    /*
      Importar de um barrel (`import { motion } from 'framer-motion'`) arrasta
      o pacote inteiro para o bundle mesmo usando uma peca so. O Next 14.2 ja
      faz esse tratamento para lucide-react e recharts por padrao; framer-motion
      e xlsx ficam de fora da lista e precisam ser declarados.
    */
    optimizePackageImports: ['framer-motion', 'lucide-react'],
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
    ]
  },
}

module.exports = withSentryConfig(
  nextConfig,
  {
    // Auth token para upload de source maps na Vercel (via env var)
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: 'o4511213732626432',
    project: 'javascript-nextjs',

    // Upload de source maps apenas na build de produção
    silent: true,
    hideSourceMaps: true,
    webpack: { treeshake: { removeDebugLogging: true } },

    // Não adiciona o Sentry no bundle do browser em dev
    widenClientFileUpload: true,
  }
)
