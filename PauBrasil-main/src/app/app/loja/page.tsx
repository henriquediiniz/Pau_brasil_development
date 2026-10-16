export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { REWARDS_STORE_ENABLED } from '@/lib/portal-features'
import { headers } from 'next/headers'
import LojaClient from './LojaClient'

export default async function LojaPage() {
  if (!REWARDS_STORE_ENABLED) redirect('/app/pontos')
  // Hydration com Server Component
  let fallbackData = null
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const cookieHeader = headers().get('cookie') || ''
    const reqInit = { headers: { cookie: cookieHeader }, cache: 'no-store' as RequestCache }
    
    // Dispara as consultas em paralelo na nuvem
    const [prods, pts, targetData] = await Promise.all([
      fetch(`${baseUrl}/api/loja`, reqInit).then(r => r.ok ? r.json() : []),
      fetch(`${baseUrl}/api/pontos`, reqInit).then(r => r.ok ? r.json() : { balance: null }),
      fetch(`${baseUrl}/api/me/target`, reqInit).then(r => r.ok ? r.json() : { targetReward: null })
    ])
    fallbackData = { products: prods, balance: pts.balance, targetData }
  } catch (e) {
    console.error('Erro no SSR Hydration da Loja:', e)
  }

  return <LojaClient fallbackData={fallbackData} />
}
