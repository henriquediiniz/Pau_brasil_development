import Link from 'next/link'
import { Users, Settings, BarChart3, ArrowRight, ClipboardList, BarChart2, Building2, MapPin, HardDrive } from 'lucide-react'

const SECTIONS = [
  { href: '/admin/usuarios',              icon: Users,          label: 'Usuários',              desc: 'Gerenciar colaboradores e papéis' },
  { href: '/admin/empresas',              icon: Building2,      label: 'Empresas & Operações',  desc: 'Cadastrar empresas e unidades' },
  { href: '/admin/funcoes',               icon: Settings,       label: 'Funções & Atividades',  desc: 'Configurar funções e tarefas' },
  { href: '/admin/auditoria',             icon: ClipboardList,  label: 'Auditoria',             desc: 'Histórico de ações no sistema' },
  { href: '/admin/obz',                   icon: BarChart2,      label: 'Estrutura OBZ',         desc: 'Estados, operações, áreas e pacotes' },
  { href: '/admin/visitas/obrigatorias',  icon: MapPin,         label: 'Visitas Obrigatórias',  desc: 'Defina obrigações mensais de visita por líder' },
  { href: '/admin/backup',               icon: HardDrive,      label: 'Backup & Restauração',  desc: 'Exportar, importar e agendar backups do sistema' },
]

export default function AdminPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
          <BarChart3 className="w-3 h-3" />
          Painel Administrativo
        </div>
        <h1 className="text-2xl font-display font-bold text-white">Administração</h1>
        <p className="text-slate-400 text-sm">Gerencie o portal Grupo Pau Brasil</p>
      </div>

      <div className="grid gap-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex items-center gap-4 p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{section.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{section.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
