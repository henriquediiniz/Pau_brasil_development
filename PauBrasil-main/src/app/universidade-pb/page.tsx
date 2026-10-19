import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { CatalogoPublico } from './_components/catalogo-publico'
import { PublicBackground } from '@/app/_components/PublicBackground'

export const metadata: Metadata = {
  title: 'Universidade Pau Brasil — Cursos Corporativos',
  description: 'Acesse trilhas de aprendizado, episódios e certificados produzidos pelos líderes do Grupo Pau Brasil.',
  openGraph: {
    title: 'Universidade Pau Brasil — Cursos Corporativos',
    description: 'Aprenda com quem faz acontecer. Cursos e certificados para colaboradores do Grupo Pau Brasil.',
    locale: 'pt_BR',
    type: 'website',
  },
}

// O banco é consultado em runtime; a build não depende de uma conexão ativa.
export const dynamic = 'force-dynamic'

const PREVIEW_COUNT = 10

function shuffleAndPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export default async function UniversidadePBPage() {
  // videoUrl é explicitamente excluído do select — jamais chega ao cliente
  const todas = await prisma.uPBTemporada.findMany({
    where: { ativo: true },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      capa: true,
      episodios: {
        where: { publicado: true },
        orderBy: { ordem: 'asc' },
        select: {
          id: true,
          titulo: true,
          descricao: true,
          duracaoMin: true,
          ordem: true,
          // videoUrl: NUNCA incluir aqui
        },
      },
    },
  })

  // Exibe até 10 cursos aleatórios — troca a cada acesso
  const temporadas = shuffleAndPick(todas, PREVIEW_COUNT)

  const totalEpisodios = todas.reduce((acc, t) => acc + t.episodios.length, 0)
  const temConteudo = todas.some(t => t.episodios.length > 0)

  return (
    <>
      <PublicBackground />
      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#111118] border-b border-white/8 flex items-center px-6">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-display font-bold text-white text-sm">Grupo Pau Brasil</span>
            </div>
          </div>
          <Link href="/login"
            className="px-4 py-1.5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        {/* Hero */}
        <section className="py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6">
            <GraduationCap className="w-3.5 h-3.5" />
            Conteúdo exclusivo para colaboradores
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black leading-tight mb-4">
            Universidade Pau Brasil
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed mb-8">
            Aprenda com quem faz acontecer. Acesse o conteúdo produzido pelos gestores do Grupo Pau Brasil.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold shadow-xl shadow-brand-500/25 hover:-translate-y-0.5 transition-all">
            Fazer login para acessar <ArrowRight className="w-4 h-4" />
          </Link>
          {temConteudo && (
            <p className="text-slate-600 text-sm mt-4">
              {todas.length} temporada{todas.length !== 1 ? 's' : ''} · {totalEpisodios} episódio{totalEpisodios !== 1 ? 's' : ''} disponível{totalEpisodios !== 1 ? 'is' : ''}
            </p>
          )}
        </section>

        {/* Catálogo */}
        {!temConteudo ? (
          <section className="rounded-2xl bg-white/3 border border-white/8 py-16 text-center">
            <GraduationCap className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-base font-medium mb-1">Em breve.</p>
            <p className="text-slate-600 text-sm mb-6">O conteúdo está sendo preparado.</p>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20">
              Fazer login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-white">
                Uma amostra do que te espera
              </h2>
              {todas.length > PREVIEW_COUNT && (
                <span className="text-xs text-slate-500">
                  Exibindo {temporadas.length} de {todas.length} cursos
                </span>
              )}
            </div>
            <CatalogoPublico temporadas={temporadas} />
          </section>
        )}
      </main>
    </>
  )
}
