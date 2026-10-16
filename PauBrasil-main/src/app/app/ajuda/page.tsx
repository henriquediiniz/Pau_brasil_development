import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AjudaClient from './AjudaClient'

export const metadata = { title: 'Ajuda — Portal Pau Brasil' }

export default async function AjudaPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  return <AjudaClient />
}
