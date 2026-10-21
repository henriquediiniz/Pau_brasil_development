import type { Metadata, Viewport } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Sprout,
  Users,
} from 'lucide-react'
import { HubFooter, HubNav } from './_components/HubShell'
import {
  HubBrandStrip,
  HubCompanies,
  HubTimeline,
  HubTalentGuide,
} from './_components/HubInteractive'
import { HubReveal } from './_components/HubReveal'
import { HubNewsletter } from './_components/HubNewsletter'
import { listarNewsletterPublicada } from '@/lib/newsletter'
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
  const newsletter = await listarNewsletterPublicada()
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
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                  <a href="#historia" className={styles.heroSecondary}>
                    Conheça o grupo <ArrowDown size={17} aria-hidden="true" />
                  </a>
                </div>
                <div className={styles.heroSignature}>
                  <Sprout size={20} strokeWidth={1.4} aria-hidden="true" />
                  <span>Origem, crescimento e pertencimento.</span>
                </div>
              </div>
              <figure className={styles.heroVisual}>
                <div className={styles.brandPlate}>
                  <Image
                    src="/brand/logo-principal.png"
                    alt="Nova identidade do Grupo Pau Brasil"
                    width={340}
                    height={275}
                    priority
                    sizes="(max-width: 700px) 230px, 340px"
                  />
                </div>
                <div className={styles.visualFooter}>
                  <span>
                    Uma nova identidade.
                    <br />
                    <strong>O mesmo propósito de crescer.</strong>
                  </span>
                  <span className={styles.brandYear}>2026</span>
                </div>
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

        <nav className={styles.quickLinks} aria-label="Acessos rápidos">
          <div className={styles.container}>
            <a href="#empresas">
              <span>01</span>
              <div>
                <strong>Conheça nossos negócios</strong>
                <small>Empresas e unidades do grupo</small>
              </div>
              <ArrowUpRight size={20} />
            </a>
            <Link href="/universidade-pb">
              <span>02</span>
              <div>
                <strong>Continue aprendendo</strong>
                <small>Universidade Pau Brasil</small>
              </div>
              <ArrowUpRight size={20} />
            </Link>
            <Link href="/carreiras/candidatar">
              <span>03</span>
              <div>
                <strong>Faça parte da nossa história</strong>
                <small>Carreiras e banco de talentos</small>
              </div>
              <ArrowUpRight size={20} />
            </Link>
          </div>
        </nav>

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
              <span className={styles.eyebrow}>
                <GraduationCap size={19} /> Universidade Pau Brasil
              </span>
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
            <div className={styles.learningPath} data-reveal>
              <span className={styles.learningEyebrow}>
                Aprendizagem em cada etapa
              </span>
              <div>
                <span>
                  <Users size={22} />
                </span>
                <div>
                  <h3>Chegar e pertencer</h3>
                  <p>Integração e conexão com a cultura do grupo.</p>
                </div>
                <small>01</small>
              </div>
              <div>
                <span>
                  <BookOpen size={22} />
                </span>
                <div>
                  <h3>Aprender na prática</h3>
                  <p>Conteúdos compartilhados pelos nossos líderes.</p>
                </div>
                <small>02</small>
              </div>
              <div>
                <span>
                  <GraduationCap size={22} />
                </span>
                <div>
                  <h3>Continuar evoluindo</h3>
                  <p>Aprendizado, avaliações e certificados.</p>
                </div>
                <small>03</small>
              </div>
              <ul className={styles.programs} aria-label="Programas do grupo">
                <li>
                  <Image
                    src="/brand/programa-capacitar.png"
                    alt="Capacitar · Grupo Pau Brasil"
                    width={640}
                    height={302}
                    sizes="180px"
                  />
                  <span>Capacitação das equipes</span>
                </li>
                <li>
                  <Image
                    src="/brand/programa-td-lideres.jpg"
                    alt="T&D Líderes · Grupo Pau Brasil"
                    width={640}
                    height={393}
                    sizes="180px"
                  />
                  <span>Treinamento e desenvolvimento de líderes</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.manifesto} aria-label="Nosso jeito">
          <div className={styles.container} data-reveal>
            <p>
              Acreditamos em <em>nossa gente.</em>
            </p>
            <span>
              Cada conquista do Grupo Pau Brasil começa nas pessoas que fazem
              parte dele.
            </span>
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
              <p className={styles.contentNote}>
                O catálogo atual de cargos contempla Pau Brasil Bebidas. A
                ampliação para as outras empresas será feita junto às equipes
                responsáveis.
              </p>
            </div>
            <HubTalentGuide />
          </div>
        </section>
      </main>
      <HubFooter />
    </div>
  )
}
