/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // APIs dinâmicas do colaborador: NetworkFirst com timeout curto para offline
      // TTL 5min — dados de pontos/metas mudam com frequência, 24h gerava staleness
      urlPattern: /\/api\/(checklist|pontos|metas\/minha|me\/target)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-pwa-cache',
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 5 },
        networkTimeoutSeconds: 3,
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // Imagens e assets estáticos — longa duração, conteúdo imutável
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // JS/CSS da Next.js — imutáveis por hash, CacheFirst seguro
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Removido: catch-all /^https?.*/ com NetworkFirst — cacheia endpoints de auth,
    // causa staleness em dados críticos e desperdiça 200 slots de cache com ruído.
  ],
  fallbacks: {
    document: '/offline',
  },
})

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'nodemailer'],
    /*
      Importar de um barrel (`import { motion } from 'framer-motion'`) arrasta
      o pacote inteiro para o bundle mesmo usando uma peca so. O Next 14.2 ja
      faz esse tratamento para lucide-react e recharts por padrao; framer-motion
      e xlsx ficam de fora da lista e precisam ser declarados.
    */
    optimizePackageImports: ['framer-motion', 'lucide-react', 'date-fns'],
    serverActions: { allowedOrigins: ['localhost:3000'] },
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'nodemailer']
    }
    return config
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
  withPWA(nextConfig),
  {
    // Auth token para upload de source maps na Vercel (via env var)
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: 'o4511213732626432',
    project: 'javascript-nextjs',

    // Upload de source maps apenas na build de produção
    silent: true,
    hideSourceMaps: true,
    disableLogger: true,

    // Não adiciona o Sentry no bundle do browser em dev
    widenClientFileUpload: true,
  }
)
