import type { Metadata, Viewport } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react'
import { HubFooter, HubNav } from './_components/HubShell'
import {
  HubBrandStrip,
  HubCompanies,
  HubTimeline,
  HubTalentGuide,
} from './_components/HubInteractive'
import { HubReveal } from './_components/HubReveal'
import { HubLearningPath } from './_components/HubLearningPath'
import { HubNewsletter } from './_components/HubNewsletter'
import { listarNewsletterPublicada } from '@/lib/newsletter'
import { carregarNoticiasGerais, carregarNossaGente } from '@/lib/endomarketing'
import { HubNoticias } from './_components/HubNoticias'
import { HubCountUp, HubHeroGlow } from './_components/HubEffects'
import {
  HUB_COMPANIES,
  HUB_FOUNDING,
  HUB_SEGMENT_COUNT,
} from '@/lib/hub-content'
import styles from './_components/Hub.module.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hub',
})
export const metadata: Metadata = {
  title: { absolute: 'Grupo Pau Brasil — Raízes fortes, novos caminhos' },
  description:
    'Conheça o Grupo Pau Brasil, nossas empresas e unidades. Explore nossa história, a Universidade Pau Brasil e oportunidades de carreira.',
  icons: { icon: '/icons/icon-192.png' },
  openGraph: {
    title: 'Grupo Pau Brasil',
    description:
      'Nossas empresas, nossa história e os próximos caminhos da sua carreira.',
    locale: 'pt_BR',
    type: 'website',
  },
}

// O hub só tem tema claro: impede que o modo escuro forçado do navegador (ex.: Samsung Internet,
// Chrome no Android) inverta as cores e apague a assinatura e as fotos.
export const viewport: Viewport = { colorScheme: 'only light' }

// A newsletter vem do banco; a página é regerada a cada 5 min e na hora em que Gente publica (revalidatePath).
export const revalidate = 300

export default async function HomePage() {
  const [newsletter, nossaGente, noticias] = await Promise.all([
    listarNewsletterPublicada(),
    carregarNossaGente(),
    carregarNoticiasGerais(),
  ])
  return (
    <div className={`${styles.hub} ${montserrat.variable}`} data-hub-root>
      <HubReveal />
      <HubNav />
      <main id="conteudo">
        <HubNewsletter items={newsletter} />
        <section className={styles.hero} aria-labelledby="hub-title">
          <HubHeroGlow />
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <span className={styles.eyebrow}>
                  <span className={styles.smallLine} /> Somos Grupo Pau Brasil
                </span>
                <h1 id="hub-title">
                  Raízes fortes.
                  <br />
                  Novos <span>caminhos.</span>
                </h1>
                <p>
                  Empresas que movimentam o presente.
                  <br className={styles.desktopBreak} /> Pessoas que constroem o
                  que vem depois.
                </p>
                <div className={styles.heroActions}>
                  <a href="#empresas" className={styles.button}>
                    Explore nossas empresas{' '}
                    <ArrowDown size={18} aria-hidden="true" />
                  </a>
                  <a href="#historia" className={styles.heroSecondary}>
                    Conheça o grupo <ArrowDown size={17} aria-hidden="true" />
                  </a>
                </div>
              </div>
              <figure className={styles.heroMark}>
                {/* SVG com animação própria (traço que se desenha); next/image não anima SVG. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo-branca-animada.svg"
                  alt="Pau Brasil, nova identidade visual"
                  width={2065}
                  height={1676}
                />
                <figcaption>
                  <span>Nova identidade</span>
                  <i aria-hidden="true" />
                  <span>2026</span>
                </figcaption>
              </figure>
            </div>
            <div className={styles.heroBottom}>
              <div className={styles.heroBottomLabel}>
                <span>Um grupo. Muitas possibilidades.</span>
                <strong>
                  <HubCountUp value={HUB_COMPANIES.length} /> empresas ·{' '}
                  <HubCountUp value={HUB_SEGMENT_COUNT} /> segmentos
                </strong>
              </div>
              <nav aria-label="Acesso direto às empresas do grupo">
                <HubBrandStrip variant="stacked" />
              </nav>
            </div>
          </div>
        </section>

        <HubNoticias {...noticias} />

        <section className={styles.manifesto} aria-label="Nosso jeito">
          <div className={styles.container} data-reveal>
            <p>
              Acreditamos em <em>nossa gente.</em>
            </p>
            <span>
              Cada conquista do Grupo Pau Brasil começa nas pessoas que fazem
              parte dele.
            </span>
            {nossaGente.numeros.length > 0 && (
              <ul className={styles.manifestoNumbers}>
                {nossaGente.numeros.slice(0, 4).map((n) => (
                  <li key={n.id}>
                    <strong>
                      <HubCountUp value={n.valor} />
                      {n.sufixo}
                    </strong>
                    <span>{n.label}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/nossa-gente" className={styles.textLink}>
              Conheça nossa gente <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section
          id="empresas"
          className={`${styles.section} ${styles.companiesSection}`}
        >
          <div className={styles.container}>
            <div className={styles.sectionHeading} data-reveal>
              <div>
                <span className={styles.eyebrow}>Nosso ecossistema</span>
                <h2>
                  Diferentes negócios.
                  <br />
                  Uma raiz em comum.
                </h2>
              </div>
              <p>
                Escolha uma empresa para conhecer suas áreas de atuação, suas
                unidades e as oportunidades de carreira.
              </p>
            </div>
            <HubCompanies />
            <div className={styles.partnersStrip} data-reveal>
              <span>Parcerias que movem nossos negócios</span>
              <ul>
                {HUB_COMPANIES.filter((company) => company.partner).map(
                  (company) => (
                    <li key={company.slug}>
                      <strong>{company.partner}</strong>
                      <small>{company.name}</small>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </section>

        <section
          id="historia"
          className={`${styles.section} ${styles.historySection}`}
        >
          <div className={styles.container}>
            <div className={styles.historyIntro}>
              <div data-reveal>
                <span className={styles.eyebrow}>
                  Nossa história, nosso futuro
                </span>
                <h2>
                  Cada caminho faz
                  <br />
                  parte da nossa história.
                </h2>
                <p>
                  Um espaço para reunir nossas origens, nossos negócios e as
                  pessoas que fazem o Grupo Pau Brasil acontecer.
                </p>
                <blockquote className={styles.founderQuote}>
                  <p>
                    Nascemos no sertão da Paraíba e aprendemos que excelência
                    não tem <em>CEP.</em>
                  </p>
                  <footer>
                    <Image
                      src="/brand/assinatura-zenildo.png"
                      alt="Zenildo Oliveira, presidente do Grupo Pau Brasil"
                      width={900}
                      height={408}
                      sizes="200px"
                    />
                  </footer>
                </blockquote>
                <span className={styles.editorialTag}>
                  Desde {HUB_FOUNDING.date} · {HUB_FOUNDING.city}
                </span>
              </div>
              <figure className={styles.founderPhoto} data-reveal>
                <Image
                  src="/brand/fundador.jpg"
                  alt="Retrato de Zenildo Oliveira, fundador do Grupo Pau Brasil"
                  width={1066}
                  height={1600}
                  sizes="(max-width: 800px) 80vw, 420px"
                />
                <figcaption>
                  <span>Onde tudo começou</span>
                  <strong>Zenildo Oliveira · Fundador</strong>
                </figcaption>
              </figure>
            </div>
            <HubTimeline />
          </div>
        </section>

        <section
          id="universidade"
          className={`${styles.section} ${styles.universitySection}`}
        >
          <div className={`${styles.container} ${styles.universityGrid}`}>
            <div data-reveal>
              <span className={styles.eyebrow}>Universidade Pau Brasil</span>
              <h2>
                Conhecimento que
                <br />
                cresce com você.
              </h2>
              <p>
                Um lugar para aprender com quem faz parte do grupo. Acesse os
                conteúdos da universidade e continue construindo sua jornada
                profissional.
              </p>
              <div className={styles.heroActions}>
                <Link
                  href="/universidade-pb"
                  className={`${styles.button} ${styles.buttonLight}`}
                >
                  Conheça a universidade <ArrowUpRight size={18} />
                </Link>
                <Link href="/universidade" className={styles.heroSecondary}>
                  Já sou colaborador <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <HubLearningPath />
          </div>
        </section>

        <section
          id="talentos"
          className={`${styles.section} ${styles.talentsSection}`}
        >
          <div className={`${styles.container} ${styles.talentGrid}`}>
            <div data-reveal>
              <span className={styles.eyebrow}>Trabalhe conosco</span>
              <h2>
                O próximo capítulo
                <br />
                pode ser <em>o seu.</em>
              </h2>
              <p>
                Explore os negócios do grupo e conheça as possibilidades para
                sua trajetória. No portal de carreiras, você pode consultar os
                cargos publicados e cadastrar seu currículo.
              </p>
              <div className={styles.talentSteps}>
                <span>
                  <b>01</b> Conheça as áreas de atuação
                </span>
                <span>
                  <b>02</b> Cadastre seu currículo
                </span>
                <span>
                  <b>03</b> Acompanhe o contato da equipe de Gente &amp; Gestão
                </span>
              </div>
              <div className={styles.heroActions}>
                <Link href="/carreiras/candidatar" className={styles.button}>
                  Cadastrar meu currículo <ArrowUpRight size={18} />
                </Link>
                <Link href="/carreiras" className={styles.textLink}>
                  Explorar carreiras <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <HubTalentGuide />
          </div>
        </section>
      </main>
      <HubFooter />
    </div>
  )
}
