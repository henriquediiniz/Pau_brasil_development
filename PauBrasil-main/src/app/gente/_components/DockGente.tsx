'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Accessibility, Award, Briefcase, ClipboardList, FileText, GaugeCircle, GraduationCap, LayoutDashboard,
  LogOut, Network, Newspaper, UserPlus, UsersRound,
} from 'lucide-react'
import { Dock, DockItem } from '@/components/ui/dock'

/**
 * Submenu do módulo Gente.
 *
 * Antes só dava para trocar de tela voltando pelo hub, o que obrigava dois
 * cliques para qualquer pulo lateral — de Vagas para Candidatos, por exemplo.
 * O dock fica acima do título de toda página do módulo e leva direto.
 */

const ITENS = [
  { href: '/gente', label: 'Visão geral', icone: LayoutDashboard },
  { href: '/gente/vagas', label: 'Vagas', icone: Briefcase },
  { href: '/gente/frontline', label: 'Vagas Frontline', icone: GaugeCircle },
  { href: '/gente/candidatos', label: 'Candidatos', icone: UserPlus },
  { href: '/gente/candidatos/internos', label: 'Candidatos internos', icone: ClipboardList },
  { href: '/gente/quadro', label: 'Quadro (QLP)', icone: UsersRound },
  { href: '/gente/desligamentos', label: 'Desligamentos', icone: LogOut },
  { href: '/gente/pcd', label: 'Gestão PCD', icone: Accessibility },
  { href: '/gente/aprendizes', label: 'Jovens Aprendizes', icone: GraduationCap },
  { href: '/gente/cargos', label: 'Descritivos de cargo', icone: FileText },
  { href: '/gente/sucessao', label: 'Pipeline de sucessão', icone: Network },
  { href: '/gente/newsletter', label: 'Newsletter do site', icone: Newspaper },
  { href: '/gente/endomarketing', label: 'Endomarketing', icone: Award },
] as const

/**
 * Qual item está ativo.
 *
 * `/gente` só acende na própria página, senão acenderia em todas. Os demais
 * acendem também nas subpáginas (`/gente/vagas/importar` acende Vagas).
 *
 * Candidatos e Candidatos internos exigem cuidado: `/gente/candidatos/internos`
 * começa com `/gente/candidatos`, então sem a checagem do item mais específico
 * os dois acenderiam ao mesmo tempo.
 */
export function itemAtivo(pathname: string): string | null {
  if (pathname === '/gente') return '/gente'

  const candidatos = ITENS.filter(
    (i) => i.href !== '/gente' && (pathname === i.href || pathname.startsWith(`${i.href}/`))
  )
  if (candidatos.length === 0) return null

  // O href mais longo é o mais específico.
  return candidatos.reduce((maior, i) => (i.href.length > maior.href.length ? i : maior)).href
}

export function DockGente() {
  const pathname = usePathname()
  const ativo = itemAtivo(pathname)

  return (
    <Dock ariaLabel="Seções do módulo Gente">
      {ITENS.map((item) => {
        const Icone = item.icone
        const estaAtivo = ativo === item.href

        return (
          <DockItem key={item.href} label={item.label}>
            <Link
              href={item.href}
              aria-label={item.label}
              aria-current={estaAtivo ? 'page' : undefined}
              className={`flex h-full w-full items-center justify-center rounded-xl border transition-colors ${
                estaAtivo
                  ? 'border-brand-500/30 bg-brand-500/15 text-brand-400'
                  : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              <Icone className="h-[45%] w-[45%] min-h-4 min-w-4" />
            </Link>
          </DockItem>
        )
      })}
    </Dock>
  )
}
