import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { hasGamificationAccess, isGestorLevel, isSysAdmin } from '@/lib/auth-helpers'
import InicioClient from './InicioClient'

export default async function InicioPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user
  const isAdmin = isSysAdmin(user)
  const isEmpresaAdmin = user.isEmpresaAdmin === true
  const isGestor = isGestorLevel(user)
  const hasGamification = hasGamificationAccess(user)

  // Redirecionamento 100% Server-Side (Zero-Latency Real)
  if (!hasGamification) {
    redirect(isEmpresaAdmin ? '/empresa' : '/universidade')
  }
  if (isAdmin) {
    redirect('/admin')
  }
  if (isGestor) {
    redirect('/gestor/dashboard')
  }

  // Pilar 1: SSR Fetching para SWR Hydration
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const cookieHeader = headers().get('cookie') || ''
  
  let fallbackData = null
  try {
    // Busca os dados internamente no servidor em paralelo (Zero-Latency pro Client)
    const reqInit = { headers: { cookie: cookieHeader }, cache: 'no-store' as RequestCache }
    const [pts, tasks, ev, meta, gg, bdgs] = await Promise.all([
      fetch(`${baseUrl}/api/pontos`, reqInit).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/checklist`, reqInit).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/pontos/evolucao`, reqInit).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/metas/minha`, reqInit).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/global-goal`, reqInit).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/conquistas`, reqInit).then(r => r.ok ? r.json() : null),
    ])

    const feitas = Array.isArray(tasks) ? tasks.filter((t: any) => ['DONE', 'APPROVED'].includes(t.status) && !t.rolledOver).length : 0
    const total  = Array.isArray(tasks) ? tasks.filter((t: any) => !t.rolledOver && !t.isAdHoc).length : 0
    
    fallbackData = {
      stats: {
        pontos: pts?.balance?.confirmed ?? 0,
        streak: ev?.streak ?? 0,
        tarefasHoje: { total, feitas },
        meta: meta ? { titulo: meta?.meta?.titulo, meta: meta?.meta?.meta, pontos: meta?.pontos, pct: meta?.pct, periodo: meta?.meta?.periodo } : null,
      },
      globalGoal: gg?.goal ?? null,
      badges: Array.isArray(bdgs) ? bdgs : []
    }
  } catch (e) {
    console.error('Erro durante o SSR Hydration:', e)
  }

  return <InicioClient session={session} fallbackData={fallbackData} />
}
