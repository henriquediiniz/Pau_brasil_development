import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { ArrowDown, ArrowUpRight, GraduationCap } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { HubFooter, HubNav } from '@/app/_components/HubShell'
import { HubLearningPath } from '@/app/_components/HubLearningPath'
import { HubReveal } from '@/app/_components/HubReveal'
import { CatalogoPublico } from './_components/catalogo-publico'
import styles from '@/app/_components/Hub.module.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hub',
})

export const metadata: Metadata = {
  title: 'Universidade Pau Brasil — Cursos Corporativos',
  description: 'Acesse trilhas de aprendizado, episódios e certificados produzidos pelos líderes do Grupo Pau Brasil.',
  icons: { icon: '/icons/icon-192.png' },
  openGraph: {
    title: 'Universidade Pau Brasil — Cursos Corporativos',
    description: 'Aprenda com quem faz acontecer. Cursos e certificados para colaboradores do Grupo Pau Brasil.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export const viewport: Viewport = { colorScheme: 'only light' }

// O banco é consultado em runtime; a build não depende de uma conexão ativa.
export const dynamic = 'force-dynamic'

const PREVIEW_COUNT = 9

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

  // Exibe alguns cursos aleatórios — troca a cada acesso
  const comConteudo = todas.filter((t) => t.episodios.length > 0)
  const temporadas = shuffleAndPick(comConteudo, PREVIEW_COUNT)
  const totalEpisodios = comConteudo.reduce((acc, t) => acc + t.episodios.length, 0)

  return (
    <div className={`${styles.hub} ${montserrat.variable}`} data-hub-root>
      <HubReveal />
      <HubNav />
      <main id="conteudo">
        <section className={`${styles.section} ${styles.universitySection} ${styles.upbHero}`}>
          <div className={`${styles.container} ${styles.universityGrid}`}>
            <div data-reveal>
              <span className={styles.eyebrow}>
                <GraduationCap size={19} /> Universidade Pau Brasil
              </span>
              <h1>
                Conhecimento que
                <br />
                cresce com você.
              </h1>
              <p>
                Aprenda com quem faz acontecer. Trilhas, episódios e certificados produzidos pelos
                líderes do Grupo Pau Brasil, disponíveis para os colaboradores no portal.
              </p>
              <div className={styles.heroActions}>
                <Link href="/login?callbackUrl=%2Funiversidade" className={`${styles.button} ${styles.buttonLight}`}>
                  Entrar para assistir <ArrowUpRight size={18} />
                </Link>
                <a href="#cursos" className={styles.heroSecondary}>
                  Ver os cursos <ArrowDown size={16} />
                </a>
              </div>
              {comConteudo.length > 0 && (
                <p className={styles.upbStats}>
                  {comConteudo.length} {comConteudo.length === 1 ? 'temporada' : 'temporadas'} ·{' '}
                  {totalEpisodios} {totalEpisodios === 1 ? 'episódio' : 'episódios'}
                </p>
              )}
            </div>
            <HubLearningPath />
          </div>
        </section>

        <section id="cursos" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeading} data-reveal>
              <div>
                <span className={styles.eyebrow}>Catálogo</span>
                <h2>
                  Uma amostra do
                  <br />
                  que te espera.
                </h2>
              </div>
              <p>
                Escolha um curso para ver os episódios. O conteúdo completo fica no portal do
                colaborador.
              </p>
            </div>
            {temporadas.length === 0 ? (
              <div className={styles.emptyState}>
                <GraduationCap size={28} />
                <h3>Novos cursos em breve.</h3>
                <p>As primeiras trilhas estão sendo preparadas pela equipe de Gente & Gestão.</p>
                <Link href="/login?callbackUrl=%2Funiversidade" className={styles.textLink}>
                  Entrar no portal <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : (
              <CatalogoPublico temporadas={temporadas} />
            )}
          </div>
        </section>

        <section className={styles.companyCta}>
          <div className={styles.container}>
            <div>
              <span className={styles.eyebrow}>Já é colaborador?</span>
              <h2>Seu aprendizado continua no portal.</h2>
              <p>Assista aos episódios, faça as avaliações e acompanhe seus certificados.</p>
            </div>
            <Link className={styles.button} href="/login?callbackUrl=%2Funiversidade">
              Acessar a Universidade <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <HubFooter />
    </div>
  )
}
