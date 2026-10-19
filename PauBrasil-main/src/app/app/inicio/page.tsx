import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ArrowRight, GraduationCap, User, HelpCircle, Shield, Building2, UsersRound } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { canAccessGente, canManageEmpresa, isSysAdmin } from '@/lib/auth-helpers'

export default async function InicioPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const user = session.user
  if (user.mustChangePassword) redirect('/app/alterar-senha')

  const links = [
    { href: '/universidade', icon: GraduationCap, title: 'Universidade', description: 'Acesse seus cursos e certificados.' },
    { href: '/app/perfil', icon: User, title: 'Meu perfil', description: 'Consulte seus dados e gerencie sua conta.' },
    { href: '/app/ajuda', icon: HelpCircle, title: 'Ajuda', description: 'Encontre orientações para usar o portal.' },
    ...(canManageEmpresa(user) ? [{ href: '/empresa', icon: Building2, title: 'Minha empresa', description: 'Gerencie colaboradores e funções.' }] : []),
    // Gente & Talentos saíram da área de administração: o atalho fica só para o RH.
    ...(canAccessGente(user) && !isSysAdmin(user) ? [{ href: '/gente', icon: UsersRound, title: 'Gente & Cultura', description: 'Acesse recrutamento e gestão de pessoas.' }] : []),
    ...(isSysAdmin(user) ? [{ href: '/admin', icon: Shield, title: 'Administração', description: 'Gerencie os acessos e as configurações do portal.' }] : []),
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="portal-welcome rounded-2xl p-7">
        <p className="text-sm text-muted-foreground">Portal do colaborador</p>
        <h1 className="text-2xl font-display font-bold text-foreground mt-2">Olá, {user.name?.split(' ')[0] ?? 'colaborador'}!</h1>
        <p className="text-muted-foreground mt-2">Acesse os serviços do Grupo Pau Brasil.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="portal-feature rounded-2xl border border-border bg-surface p-5 hover:border-brand-500/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <div className="flex items-center justify-between text-brand-400"><Icon size={24} /><ArrowRight size={18} /></div>
            <h2 className="text-foreground font-semibold mt-4">{title}</h2>
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
