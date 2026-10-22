import type { Metadata, Viewport } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { ArrowUpRight, Award, CalendarDays } from 'lucide-react'
import { HubFooter, HubNav } from '@/app/_components/HubShell'
import { HubReveal } from '@/app/_components/HubReveal'
import { HubCountUp } from '@/app/_components/HubEffects'
import { HUB_COMPANIES } from '@/lib/hub-content'
import { CATEGORIAS_RECONHECIMENTO, CORES_CAMPANHA, carregarNossaGente } from '@/lib/endomarketing'
import styles from '@/app/_components/Hub.module.css'

const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-hub' })

export const metadata: Metadata = {
  title: { absolute: 'Nossa Gente · Grupo Pau Brasil' },
  description: 'Reconhecimentos, campanhas e números que mostram a cultura do Grupo Pau Brasil.',
  icons: { icon: '/icons/icon-192.png' },
}

export const viewport: Viewport = { colorScheme: 'only light' }

// Conteúdo do banco; regerado a cada 5 min e na hora em que Gente publica (revalidatePath).
export const revalidate = 300

const TZ = 'America/Fortaleza'
const mesAno = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: TZ })
const dia = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: TZ }).replace('.', '')
const nomeEmpresa = (slug: string) => HUB_COMPANIES.find((c) => c.slug === slug)?.name ?? slug
const iniciais = (nome: string) =>
  nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export default async function NossaGentePage() {
  const { reconhecimentos, campanhas, numeros, mesNumeros, ano } = await carregarNossaGente()
  const agora = new Date()
  const situacao = (inicio: Date, fim: Date | null) => {
    const termino = fim ?? new Date(inicio.getTime() + 24 * 60 * 60 * 1000)
    if (agora >= inicio && agora < termino) return 'agora'
    return agora < inicio ? 'proxima' : 'passada'
  }
  const vazio = !reconhecimentos.length && !campanhas.length && !numeros.length

  return (
    <div className={`${styles.hub} ${montserrat.variable}`} data-hub-root>
      <HubReveal />
      <HubNav />
      <main id="conteudo">
        <section className={styles.ngHero}>
          <div className={styles.container} data-reveal>
            <span className={styles.eyebrow}>Nossa gente</span>
            <h1>
              Acreditamos em <em>nossa gente.</em>
            </h1>
            <p>
              Conquistas, campanhas e números que mostram, todo mês, quem faz o Grupo Pau Brasil
              acontecer.
            </p>
            <nav className={styles.ngAnchors} aria-label="Seções da página">
              {numeros.length > 0 && <a href="#numeros">Números do mês</a>}
              {reconhecimentos.length > 0 && <a href="#reconhecimento">Mural de reconhecimento</a>}
              {campanhas.length > 0 && <a href="#calendario">Calendário {ano}</a>}
            </nav>
          </div>
        </section>

        {numeros.length > 0 && mesNumeros && (
          <section id="numeros" className={styles.ngNumbers} aria-labelledby="numeros-titulo">
            <div className={styles.container}>
              <div className={styles.ngNumbersHead} data-reveal>
                <h2 id="numeros-titulo">Números do mês</h2>
                <span>{mesAno(mesNumeros)}</span>
              </div>
              <ul>
                {numeros.map((n) => (
                  <li key={n.id} data-reveal>
                    <strong>
                      <HubCountUp value={n.valor} />
                      {n.sufixo}
                    </strong>
                    <span>{n.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {reconhecimentos.length > 0 && (
          <section id="reconhecimento" className={styles.section} aria-labelledby="mural-titulo">
            <div className={styles.container}>
              <div className={styles.sectionHeading} data-reveal>
                <div>
                  <span className={styles.eyebrow}>
                    <Award size={16} /> Mural de reconhecimento
                  </span>
                  <h2 id="mural-titulo">
                    Gente que faz
                    <br />a diferença.
                  </h2>
                </div>
                <p>Destaques escolhidos pelas lideranças e pela equipe de Gente & Gestão.</p>
              </div>
              <ul className={styles.ngWall}>
                {reconhecimentos.map((r) => (
                  <li key={r.id} data-reveal>
                    <article className={styles.ngCard}>
                      <div className={styles.ngPerson}>
                        {r.fotoUrl ? (
                          <Image src={r.fotoUrl} alt="" width={96} height={96} className={styles.ngAvatar} />
                        ) : (
                          <span className={styles.ngAvatar} aria-hidden="true">{iniciais(r.nome)}</span>
                        )}
                        <div>
                          <h3>{r.nome}</h3>
                          <p>{r.cargo}</p>
                        </div>
                      </div>
                      <span className={styles.ngTag}>
                        {CATEGORIAS_RECONHECIMENTO[r.categoria as keyof typeof CATEGORIAS_RECONHECIMENTO] ?? r.categoria}
                      </span>
                      <blockquote>{r.motivo}</blockquote>
                      <footer>
                        {nomeEmpresa(r.company)} · {r.unit} · {mesAno(r.mes)}
                      </footer>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {campanhas.length > 0 && (
          <section id="calendario" className={`${styles.section} ${styles.ngCalendarSection}`} aria-labelledby="calendario-titulo">
            <div className={styles.container}>
              <div className={styles.sectionHeading} data-reveal>
                <div>
                  <span className={styles.eyebrow}>
                    <CalendarDays size={16} /> Calendário de campanhas
                  </span>
                  <h2 id="calendario-titulo">
                    Um ano inteiro
                    <br />
                    cuidando de quem cuida.
                  </h2>
                </div>
                <p>As campanhas internas de {ano}. Fique de olho nas próximas.</p>
              </div>
              <ol className={styles.ngCalendar}>
                {campanhas.map((c) => {
                  const estado = situacao(c.inicio, c.fim)
                  const cor = CORES_CAMPANHA[c.cor as keyof typeof CORES_CAMPANHA]?.cor ?? '#7a1520'
                  return (
                    <li key={c.id} data-estado={estado} style={{ '--campanha': cor } as React.CSSProperties} data-reveal>
                      <span className={styles.ngDate}>
                        {dia(c.inicio)}
                        {c.fim && <small>até {dia(c.fim)}</small>}
                      </span>
                      <div>
                        <h3>
                          {c.title}
                          {estado === 'agora' && <em>Acontecendo agora</em>}
                        </h3>
                        <p>{c.descricao}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </section>
        )}

        {vazio && (
          <section className={styles.section}>
            <div className={`${styles.container} ${styles.emptyState}`}>
              <Award size={28} />
              <h3>Em breve.</h3>
              <p>Os primeiros reconhecimentos e campanhas estão sendo preparados.</p>
            </div>
          </section>
        )}

        <section className={styles.companyCta}>
          <div className={styles.container}>
            <div>
              <span className={styles.eyebrow}>Faça parte</span>
              <h2>O próximo destaque pode ser você.</h2>
              <p>Conheça as oportunidades do grupo e cadastre seu currículo.</p>
            </div>
            <Link className={styles.button} href="/#talentos">
              Trabalhe conosco <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <HubFooter />
    </div>
  )
}
