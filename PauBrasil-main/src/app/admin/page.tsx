import Link from 'next/link'
import {
  Users,
  Settings,
  BarChart3,
  ArrowRight,
  ClipboardList,
  Building2,
  HardDrive,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react'

type Section = { href: string; icon: LucideIcon; label: string; desc: string }

/** Agrupado por tarefa: quem administra procura "pessoas", "estrutura" ou "sistema". */
const GROUPS: { title: string; items: Section[] }[] = [
  {
    title: 'Pessoas e acesso',
    items: [
      { href: '/admin/usuarios', icon: Users, label: 'Usuários', desc: 'Colaboradores, papéis e permissões' },
      { href: '/admin/funcoes', icon: Settings, label: 'Funções', desc: 'Funções usadas no cadastro de colaboradores' },
    ],
  },
  {
    title: 'Estrutura do grupo',
    items: [
      { href: '/admin/empresas', icon: Building2, label: 'Empresas', desc: 'Empresas e suas operações' },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      { href: '/admin/upb', icon: GraduationCap, label: 'Universidade', desc: 'Cursos, episódios, quizzes e matrículas' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/admin/auditoria', icon: ClipboardList, label: 'Auditoria', desc: 'Histórico de ações no portal' },
      { href: '/admin/backup', icon: HardDrive, label: 'Backup e restauração', desc: 'Exportar, importar e agendar backups' },
    ],
  },
]

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
          <BarChart3 className="w-3 h-3" aria-hidden="true" />
          Painel administrativo
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie acessos, estrutura e configurações do portal Grupo Pau Brasil.</p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} aria-labelledby={`admin-${group.title}`} className="space-y-3">
          <h2 id={`admin-${group.title}`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((section) => {
              const Icon = section.icon
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-brand-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground font-medium">{section.label}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{section.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-400 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
