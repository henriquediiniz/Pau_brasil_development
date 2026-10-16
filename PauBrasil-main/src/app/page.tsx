import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Award, Building2, GraduationCap, Layers, TrendingUp, MapPin, CheckCircle2 } from 'lucide-react'
import { PublicNav } from './_components/PublicNav'
import { TestimonialsCarousel } from './_components/TestimonialsCarousel'
import { HomeBackground } from './_components/HomeBackground'
import { AnimatedStats } from './_components/AnimatedStats'
import { EmailsCurriculo } from './_components/EmailsCurriculo'

export const metadata: Metadata = {
  title: 'Grupo Pau Brasil — Portal Corporativo',
  description: 'Portal corporativo do Grupo Pau Brasil. Acesse o portal do colaborador, confira as vagas abertas e conheça a Universidade Pau Brasil.',
  openGraph: {
    title: 'Grupo Pau Brasil — Portal Corporativo',
    description: 'Portal corporativo do Grupo Pau Brasil.',
    locale: 'pt_BR',
    type: 'website',
  },
}

const COMPANIES = [
  { name: 'Distribuidora Pau Brasil', desc: 'Distribuição de bebidas e produtos atendendo centenas de cidades no Nordeste.' },
  { name: 'Pau Brasil Motos', desc: 'Rede de concessionárias Honda com venda, peças e assistência técnica.' },
  { name: 'Unida Construtora', desc: 'Desenvolvimento de empreendimentos imobiliários e projetos de construção civil.' },
  { name: 'Instituto YSO', desc: 'Projetos sociais e educacionais voltados ao desenvolvimento da comunidade.' },
  { name: 'Original Start', desc: 'Iniciativas de inovação, empreendedorismo e desenvolvimento de novos negócios.' },
  { name: 'Hora 10', desc: 'Soluções em gestão de pessoas e processos para o grupo e parceiros.' },
  { name: 'Locadora de Veículos Pau Brasil', desc: 'Soluções de locação de veículos e gestão de frotas para mobilidade empresarial.' },
  { name: 'Fazenda Divina', desc: 'Produção agropecuária com foco em pecuária e desenvolvimento genético.' },
]

const DIFERENCIAIS = [
  {
    icon: Layers,
    titulo: 'Diversidade de negócios',
    desc: 'Bebidas, motos, construção, agro e mais. 8 empresas, múltiplas carreiras, um mesmo propósito.',
  },
  {
    icon: TrendingUp,
    titulo: 'Crescimento real',
    desc: 'Priorizamos promoções internas. Quem entra como auxiliar chega à liderança. Sua trajetória começa aqui.',
  },
  {
    icon: GraduationCap,
    titulo: 'Universidade corporativa',
    desc: 'Cursos, certificados e provas produzidos pelos próprios líderes do grupo. Aprenda com quem faz acontecer.',
  },
  {
    icon: MapPin,
    titulo: 'Raízes no Nordeste',
    desc: 'Mais de 30 anos desenvolvendo pessoas e comunidades no coração do Brasil. Propósito que vai além do trabalho.',
  },
]


const PROCESSO = [
  { n: '01', etapa: 'Cadastre-se', desc: 'Preencha o formulário com seu currículo e áreas de interesse.' },
  { n: '02', etapa: 'Análise de perfil', desc: 'Nossa equipe avalia seu perfil e entra em contato.' },
  { n: '03', etapa: 'Entrevista', desc: 'Conversa com RH e com a liderança da área de interesse.' },
  { n: '04', etapa: 'Boas-vindas', desc: 'Integração, acesso ao portal e início da sua jornada no grupo.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen text-white">

      <HomeBackground />

      <PublicNav />

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-6">
            <Award className="w-4 h-4" />
            Portal Corporativo Grupo Pau Brasil
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-black leading-tight">
            Conectando pessoas<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
              e propósito
            </span>
          </h1>
          <p className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Um grupo com raízes no Nordeste, presente em diversos segmentos e comprometido com o crescimento das pessoas e das comunidades onde atua.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold shadow-xl shadow-brand-500/25 hover:-translate-y-1 transition-all">
              Acessar Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/carreiras"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors">
              Ver vagas abertas
            </Link>
          </div>
        </div>
      </section>

      {/* Por que trabalhar no grupo */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-black text-white">Por que trabalhar no Grupo Pau Brasil?</h2>
            <p className="text-slate-400 text-sm mt-2">Mais do que um emprego. Uma jornada de crescimento.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIFERENCIAIS.map(({ icon: Icon, titulo, desc }) => (
              <div key={titulo} className="rounded-2xl bg-white/3 border border-white/8 p-5 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="text-sm font-semibold text-white mb-1">{titulo}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vagas Inclusão — PCD e Mulheres */}
      <section
        className="py-16 px-6 border-t border-white/5"
        aria-labelledby="inclusao-heading"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs mb-4">
              Diversidade &amp; Inclusão
            </div>
            <h2
              id="inclusao-heading"
              className="text-2xl md:text-3xl font-display font-black text-white"
            >
              Times diversos tomam<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
                decisões mais fortes
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
              Representatividade não é meta. É estratégia. Conheça as vagas exclusivas
              para pessoas PCD e para mulheres no Grupo Pau Brasil.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Card PCD */}
            <div
              className="rounded-2xl bg-white/3 border border-white/8 p-6 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all"
            >
              <div
                className="w-11 h-11 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-brand-400">
                  <circle cx="12" cy="4.5" r="1.5" fill="currentColor" stroke="none" />
                  <path d="M9 8.5h5" />
                  <path d="M12 8.5v5l3 2.5" />
                  <path d="M9 10l-2 5" />
                  <circle cx="9" cy="18" r="2" />
                </svg>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-semibold tracking-wide uppercase mb-3">
                PCD
              </span>
              <h3 className="text-sm font-semibold text-white mb-1">
                Pessoas com Deficiência
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Temos vagas reservadas e ambientes adaptados. Sua capacidade define seu espaço aqui, sem rótulos.
              </p>
            </div>
            {/* Card Mulheres */}
            <div
              className="rounded-2xl bg-white/3 border border-white/8 p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
            >
              <div
                className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-purple-400">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M12 12v8" />
                  <path d="M9 17h6" />
                </svg>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-semibold tracking-wide uppercase mb-3">
                Mulheres
              </span>
              <h3 className="text-sm font-semibold text-white mb-1">
                Liderança feminina no Nordeste
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vagas exclusivas para acelerar a presença feminina em todas as áreas do grupo, do operacional à diretoria.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/carreiras/candidatar"
              className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold shadow-xl shadow-brand-500/25 hover:-translate-y-1 transition-all"
            >
              Entrar no Banco de Talentos
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="text-center text-xs text-slate-500 mt-4">
            <p className="mb-1">Inscreva-se pelo site ou envie seu currículo por e-mail:</p>
            <EmailsCurriculo />
          </div>
        </div>
      </section>

      {/* Companies */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-5 h-5 text-brand-400" />
            <h2 className="text-xl font-display font-bold">Nossas Empresas</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COMPANIES.map((company) => (
              <div key={company.name}
                className="rounded-2xl bg-white/3 border border-white/8 p-5 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-xs">{company.name[0]}</span>
                </div>
                <div className="text-sm font-medium text-white">{company.name}</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{company.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <AnimatedStats />
          {/* Destaque do faturamento */}
          <div className="rounded-2xl bg-gradient-to-r from-brand-500/10 to-brand-600/5 border border-brand-500/20 px-6 py-4 text-center">
            <p className="text-brand-300 font-semibold text-sm">
              Grupo com faturamento anual superior a{' '}
              <span className="text-brand-200 font-black text-base">R$ 1 bilhão</span>
              {'. '}Uma das maiores empresas do Nordeste.
            </p>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-black text-white">Quem faz o grupo falar</h2>
            <p className="text-slate-400 text-sm mt-2">Do jovem aprendiz à diretoria. Histórias reais de quem cresceu com a gente.</p>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* Universidade PB */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-brand-500/5 border border-purple-500/20 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
                <GraduationCap className="w-3.5 h-3.5" />
                Universidade Corporativa
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-white mb-3">
                Aprenda com quem<br />faz acontecer
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                Cursos e trilhas de aprendizado produzidos pelos líderes do Grupo Pau Brasil.
                Certificados, provas e pontos para quem se desenvolve.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
              <Link href="/universidade-pb"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors shadow-lg shadow-purple-500/20">
                Ver cursos disponíveis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors">
                Já sou colaborador — Entrar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Processo seletivo */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-black text-white">Como funciona o processo seletivo?</h2>
            <p className="text-slate-400 text-sm mt-2">Simples, transparente e focado em pessoas.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {PROCESSO.map(({ n, etapa, desc }) => (
              <div key={n} className="relative rounded-2xl bg-white/3 border border-white/8 p-5">
                <div className="text-3xl font-display font-black text-brand-500/30 mb-3 leading-none">{n}</div>
                <div className="text-sm font-semibold text-white mb-1">{etapa}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/carreiras/candidatar"
              className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold shadow-xl shadow-brand-500/25 hover:-translate-y-0.5 transition-all">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Quero me candidatar
            </Link>
            <Link href="/contato"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors">
              Falar com o RH
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <span>© {new Date().getFullYear()} Grupo Pau Brasil. Todos os direitos reservados.</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 justify-center" aria-label="Links do rodapé">
            <Link href="/carreiras" className="hover:text-slate-400 transition-colors">Carreiras</Link>
            <Link href="/universidade-pb" className="hover:text-slate-400 transition-colors">Universidade</Link>
            <Link href="/contato" className="hover:text-slate-400 transition-colors">Contato</Link>
            <Link href="/login" className="hover:text-slate-400 transition-colors">Acessar Portal</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
