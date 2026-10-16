import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  LayoutPanelLeft,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Preview Banco de Talentos',
  description: 'Preview visual da jornada de candidatura e do painel RH.',
}

const selectedJobs = ['Motorista da Distribuicao', 'Ajudante da Distribuicao', 'Auxiliar de Logistica']

const candidates = [
  ['Joao Silva', 'Patos, PB', 'TRIAGEM', '12 abr'],
  ['Maria Eduarda', 'Sousa, PB', 'ENTREVISTA', '10 abr'],
  ['Cicero Ramos', 'Guarabira, PB', 'RECEBIDO', '09 abr'],
]

const contactItems: Array<{ icon: LucideIcon; label: string; value: string }> = [
  { icon: Users, label: 'Nome completo', value: 'Joao Silva Santos' },
  { icon: Mail, label: 'E-mail', value: 'joao@email.com' },
  { icon: Phone, label: 'Telefone', value: '(83) 99999-9999' },
  { icon: MapPin, label: 'Cidade e estado', value: 'Patos, PB' },
]

const filterItems: Array<{ icon: LucideIcon; label: string; value: string }> = [
  { icon: Search, label: 'Busca', value: 'Joao Silva' },
  { icon: Filter, label: 'Etapa', value: 'Todos os status' },
  { icon: MapPin, label: 'Cidade', value: 'Patos' },
  { icon: BadgeCheck, label: 'Cargo', value: 'Distribuicao' },
]

function Card({ children, className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={`rounded-[28px] border border-white/10 ${className}`} {...props}>
      {children}
    </div>
  )
}

export default function CarreirasPreviewPage() {
  return (
    <main className="min-h-screen bg-[#07130d] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(21,214,110,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_22%),linear-gradient(180deg,_#08150f_0%,_#07130d_100%)]" />
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <Card className="bg-white/6 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                <Sparkles className="h-4 w-4" />
                Preview visual
              </div>
              <h1 className="mt-5 font-display text-4xl font-black tracking-tight md:text-6xl">
                Banco de Talentos com cara de produto premium.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
                Esta pagina nao e funcional. Ela existe so para voce sentir a direcao visual da experiencia
                do candidato e do painel de triagem do RH antes da implementacao final.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/carreiras"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Carreiras
              </Link>
              <a
                href="#painel-rh"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Ver painel RH
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Card>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
          <Card className="bg-[#0d1d17]/92 p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
              Experiencia do candidato
            </div>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight">Formulario em 4 passos</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Menos atrito, mais clareza. A proposta e transformar o envio do curriculo em uma experiencia
              guiada, leve e alinhada com marca empregadora.
            </p>

            <div className="mt-7 space-y-3">
              {[
                '01  Quem e voce?',
                '02  Onde quer atuar?',
                '03  Seu curriculo',
                '04  Confirmacao',
              ].map((step, index) => (
                <div
                  key={step}
                  className={`rounded-[24px] border p-4 ${
                    index === 1
                      ? 'border-emerald-300/35 bg-gradient-to-r from-emerald-300/14 to-lime-300/8'
                      : 'border-white/8 bg-white/4'
                  }`}
                >
                  <div className="text-base font-semibold text-white">{step}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-[24px] border border-white/8 bg-black/20 p-5 text-sm leading-7 text-white/66">
              Destaques: limite visual de selecao, upload elegante do PDF, consentimento LGPD e tela final
              com mensagem humana em vez de resposta fria de sistema.
            </div>
          </Card>

          <Card className="bg-white/7 p-4 backdrop-blur-xl md:p-6">
            <div className="rounded-[30px] border border-white/10 bg-[#eef5ef] p-5 text-slate-900 md:p-7">
              <div className="flex flex-col gap-5 border-b border-slate-900/8 pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-50">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Candidatura espontanea
                  </div>
                  <h3 className="mt-4 font-display text-3xl font-black tracking-tight text-slate-950">
                    Deixe seu curriculo no nosso banco de talentos
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Mesmo sem vaga aberta, seu perfil ja entra organizado por cidade e interesses para o RH.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-950 p-4 text-white">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-white/45">Passo atual</div>
                  <div className="mt-2 h-2.5 w-44 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-300" />
                  </div>
                  <div className="mt-2 text-sm font-medium text-white/72">2 de 4</div>
                </div>
              </div>

              <div className="mt-7 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-5">
                  <Card className="border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(5,20,12,0.06)]">
                    <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Passo 2</div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">Onde voce quer atuar?</div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {['Distribuicao', 'Armazem', 'RH', 'Financeiro'].map((group) => (
                        <div key={group} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <div className="text-base font-bold text-slate-950">{group}</div>
                          <div className="mt-3 space-y-2">
                            {selectedJobs.slice(0, group === 'Distribuicao' ? 2 : 1).map((job) => (
                              <div
                                key={`${group}-${job}`}
                                className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm"
                              >
                                <span className="font-medium text-slate-950">{job}</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <Card className="border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(5,20,12,0.06)]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-slate-950 p-3 text-white">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-950">Curriculo em PDF</div>
                          <div className="text-sm text-slate-500">Upload validado antes do envio.</div>
                        </div>
                      </div>
                      <div className="mt-5 rounded-[24px] border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-6 text-center">
                        <FileText className="mx-auto h-8 w-8 text-emerald-700" />
                        <div className="mt-3 font-semibold text-slate-950">curriculo-joao-silva.pdf</div>
                        <div className="mt-1 text-sm text-slate-500">2.4 MB  •  PDF valido</div>
                      </div>
                    </Card>

                    <Card className="border-slate-950/6 bg-slate-950 p-5 text-white shadow-[0_20px_50px_rgba(5,20,12,0.12)]">
                      <div className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">
                        Resumo rapido
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedJobs.map((job) => (
                          <span
                            key={job}
                            className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-medium text-white/78"
                          >
                            {job}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 space-y-3 text-sm text-white/72">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Patos, PB</div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Consentimento LGPD aceito</div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Status esperado: recebido</div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="space-y-5">
                  <Card className="border-slate-950/8 bg-slate-950 p-5 text-white">
                    <div className="rounded-[24px] border border-emerald-300/20 bg-gradient-to-br from-emerald-500/20 to-lime-300/10 p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-300 p-3 text-slate-950">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-lg font-bold">Recebemos seu curriculo</div>
                          <div className="text-sm text-white/65">Fique de olho em joao@email.com</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-white/70">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-4 w-4 text-emerald-300" />
                        Dados tratados para recrutamento e banco de talentos.
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-emerald-300" />
                        Linguagem mais humana e menos burocratica.
                      </div>
                    </div>
                  </Card>

                  <Card className="border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(5,20,12,0.06)]">
                    <div className="space-y-3">
                      {contactItems.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="rounded-2xl border border-slate-200 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-emerald-600" />
                            <div>
                              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card id="painel-rh" className="mt-10 bg-[#0b1913]/92 p-4 backdrop-blur-xl md:p-6">
          <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 md:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                  <LayoutPanelLeft className="h-4 w-4" />
                  Painel RH
                </div>
                <h2 className="mt-5 font-display text-4xl font-black tracking-tight">Triagem elegante e objetiva.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62">
                  Filtros visiveis, tabela forte e drawer lateral com curriculo, historico e nota na mesma tela.
                </p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-5 py-3 text-sm font-semibold text-slate-950">
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                ['Novos curriculos', '128'],
                ['Em triagem', '34'],
                ['Tempo medio', '18h'],
                ['Aderencia inicial', '62%'],
              ].map(([label, value]) => (
                <Card key={label} className="bg-white/6 p-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">{label}</div>
                  <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
                </Card>
              ))}
            </div>

            <div className="mt-8 rounded-[30px] border border-white/10 bg-black/18 p-4">
              <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_auto]">
                {filterItems.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-[24px] border border-white/8 bg-white/6 px-4 py-3">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/42">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">{value}</div>
                  </div>
                ))}
                <button className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/12 px-4 py-3 text-sm font-semibold text-emerald-100">
                  Aplicar
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="bg-white/6 p-4">
                <div className="overflow-hidden rounded-[24px] border border-white/8">
                  <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.65fr] gap-4 border-b border-white/8 bg-white/6 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                    <div>Nome</div>
                    <div>Cidade</div>
                    <div>Etapa</div>
                    <div>Data</div>
                  </div>
                  <div className="divide-y divide-white/6">
                    {candidates.map(([name, city, stage, date], index) => (
                      <div
                        key={name}
                        className={`grid grid-cols-[1.2fr_1fr_0.8fr_0.65fr] gap-4 px-5 py-4 ${
                          index === 0 ? 'bg-emerald-300/10' : ''
                        }`}
                      >
                        <div className="font-semibold text-white">{name}</div>
                        <div className="text-sm text-white/68">{city}</div>
                        <div className="text-sm text-white/68">{stage}</div>
                        <div className="text-sm text-white/68">{date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="bg-[#0b1712] p-5">
                <div className="text-2xl font-black tracking-tight">Joao Silva</div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/60">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-300" />
                    joao@email.com
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-300" />
                    (83) 99999-9999
                  </span>
                </div>
                <div className="mt-5 rounded-[24px] border border-white/8 bg-white/6 p-4 text-sm leading-7 text-white/68">
                  Perfil forte para distribuicao em Patos. Boa disponibilidade, curriculo objetivo e historico
                  consistente para triagem imediata.
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedJobs.map((job) => (
                    <span
                      key={job}
                      className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-medium text-white/78"
                    >
                      {job}
                    </span>
                  ))}
                </div>
                <div className="mt-5 rounded-[24px] border border-white/8 bg-white/6 p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">Nova nota</div>
                  <div className="mt-3 rounded-[20px] border border-dashed border-white/12 bg-black/22 p-4 text-sm text-white/45">
                    Perfil aderente para uma futura vaga de distribuicao.
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
