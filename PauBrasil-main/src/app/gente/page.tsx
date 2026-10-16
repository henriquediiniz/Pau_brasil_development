import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import {
  Accessibility, ArrowRight, Briefcase, ClipboardList, FileText, GaugeCircle, GraduationCap,
  LogOut, Network, UserPlus, Users, UsersRound,
} from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { canAccessGente } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { PainelGente } from './_components/PainelGente'

export const metadata = { title: 'Gente — Portal Pau Brasil' }

/**
 * Hub do módulo Gente. Cada item vira uma tela na Fase 2 do plano
 * (docs/plano-integracao-recrutamento.md §3). Ao entregar uma tela, basta
 * marcar `pronto: true` — a ordem aqui é a mesma ordem de entrega do plano.
 */
const SECOES = [
  { href: '/gente/vagas',              icon: Briefcase,     label: 'Controle de Vagas',   desc: 'Requisições, SLA de fechamento e vagas frontline',        pronto: true },
  { href: '/gente/frontline',          icon: GaugeCircle,   label: 'Vagas Frontline',     desc: 'QLP meta x vagas abertas e o indice de comprometimento', pronto: true },
  { href: '/gente/candidatos',         icon: UserPlus,      label: 'Candidatos',          desc: 'Processo seletivo, etapas e banco de stand-by',           pronto: true },
  { href: '/gente/quadro',             icon: UsersRound,    label: 'Quadro (QLP)',        desc: 'Quadro de lotação de pessoal por operação',               pronto: true },
  { href: '/gente/desligamentos',      icon: LogOut,        label: 'Desligamentos',       desc: 'Histórico de saídas, motivos e turnover',                 pronto: true },
  { href: '/gente/pcd',                icon: Accessibility, label: 'Gestão PCD',          desc: 'Colaboradores PCD, laudos e cota legal',                  pronto: true },
  { href: '/gente/aprendizes',         icon: GraduationCap, label: 'Jovens Aprendizes',   desc: 'Contratos, vigências e alerta de vencimento',             pronto: true },
  { href: '/gente/cargos',             icon: FileText,      label: 'Descritivos de Cargo', desc: 'Padrão de cargo e verificador de aderência da vaga',     pronto: true },
  { href: '/gente/candidatos/internos', icon: ClipboardList, label: 'Candidatos Internos', desc: 'Recrutamento interno e movimentações',                   pronto: true },
  { href: '/gente/sucessao',           icon: Network,       label: 'Pipeline de Sucessão', desc: 'Sucessores mapeados e prontidão por cargo',              pronto: true },
] as const

export default async function GentePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Defesa em profundidade: o middleware já barra, mas a página confere de novo
  // contra o usuário fresco do banco, não contra o token.
  const user = await getEffectiveSessionUser(session.user)
  if (!canAccessGente(user)) redirect('/app/hoje')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
          <Users className="w-3 h-3" />
          Gente &amp; Cultura
        </div>
        <h1 className="text-2xl font-display font-bold text-white">Gente</h1>
        <p className="text-slate-400 text-sm">Recrutamento, quadro de pessoal e sucessão</p>
      </div>

      <PainelGente />

      <div className="grid gap-3">
        {SECOES.map((secao) => {
          const Icon = secao.icon

          if (!secao.pronto) {
            return (
              <div
                key={secao.href}
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/3 border border-white/8 opacity-50 cursor-not-allowed"
                aria-disabled="true"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{secao.label}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{secao.desc}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wide font-medium text-slate-500 border border-white/10 rounded-full px-2 py-0.5 shrink-0">
                  Em breve
                </span>
              </div>
            )
          }

          return (
            <Link
              key={secao.href}
              href={secao.href}
              className="group flex items-center gap-4 p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{secao.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{secao.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
            </Link>
          )
        })}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/3 border border-white/8">
        <Users className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-slate-400 text-xs leading-relaxed">
          O módulo está sendo construído tela por tela. Enquanto isso, o{' '}
          <Link href="/talentos" className="text-brand-400 hover:underline">
            Banco de Talentos
          </Link>{' '}
          segue como a entrada de candidaturas do site.
        </p>
      </div>
    </div>
  )
}
