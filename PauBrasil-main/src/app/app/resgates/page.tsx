import { redirect } from 'next/navigation'
import { REWARDS_STORE_ENABLED } from '@/lib/portal-features'
import ResgatesClient from './ResgatesClient'

export default function ResgatesPage() {
  if (!REWARDS_STORE_ENABLED) redirect('/app/pontos')
  return <ResgatesClient />
}
