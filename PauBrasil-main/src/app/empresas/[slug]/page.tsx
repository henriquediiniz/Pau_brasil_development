import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { HUB_COMPANIES } from '@/lib/hub-content'
import { HubFooter, HubNav } from '@/app/_components/HubShell'
import {
  BrandPlate,
  HubBrandStrip,
  HubUnits,
} from '@/app/_components/HubInteractive'
import styles from '@/app/_components/Hub.module.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hub',
})
export function generateStaticParams() {
  return HUB_COMPANIES.map(({ slug }) => ({ slug }))
}
export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  const company = HUB_COMPANIES.find((item) => item.slug === params.slug)
  return {
    title: company
      ? `${company.name} · Grupo Pau Brasil`
      : 'Empresa não encontrada',
    description: company?.description,
    icons: { icon: '/icons/icon-192.png' },
  }
}
export default function CompanyPage({ params }: { params: { slug: string } }) {
  const company = HUB_COMPANIES.find((item) => item.slug === params.slug)
  if (!company) notFound()
  if (company.externalUrl) redirect(company.externalUrl)
  return (
    <div className={`${styles.hub} ${montserrat.variable}`}>
      <HubNav />
      <main id="conteudo">
        <section
          className={`${styles.section} ${styles.companyHero} ${styles.companyEnter}`}
        >
          <div className={styles.container}>
            <Link href="/#empresas" className={styles.backLink}>
              <ArrowLeft size={17} /> Todas as empresas
            </Link>
            <div className={styles.companyHeroGrid}>
              <div className={styles.companyHeroCopy}>
                <BrandPlate company={company} size="hero" />
                <span className={styles.eyebrow}>
                  {company.segment}
                  {company.partner ? ` · ${company.partner}` : ''}
                </span>
                <h1>{company.name}</h1>
                <p>{company.description}</p>
                <a
                  href="#unidades"
                  className={`${styles.button} ${styles.buttonLight}`}
                >
                  Conheça nossas unidades <ArrowRight size={18} />
                </a>
              </div>
              <div className={styles.activityPanel}>
                <span>Áreas de atuação</span>
                <ul>
                  {company.activities.map((activity) => (
                    <li key={activity}>
                      <Check size={16} aria-hidden="true" />
                      {activity}
                    </li>
                  ))}
                </ul>
                {company.units.length > 0 && (
                  <a href="#unidades" className={styles.activityStat}>
                    <strong>{company.units.length}</strong>
                    <span>
                      unidades em{' '}
                      {new Set(company.units.map((u) => u.state)).size} estados
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
        <section id="unidades" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Nossa presença</span>
                <h2>Encontre uma unidade.</h2>
              </div>
              <p>Conheça as cidades que fazem parte da operação.</p>
            </div>
            <HubUnits company={company} />
          </div>
        </section>
        <section className={styles.companyCta}>
          <div className={styles.container}>
            <div>
              <span className={styles.eyebrow}>Faça parte</span>
              <h2>Seu talento pode abrir novos caminhos.</h2>
              <p>
                {company.slug === 'bebidas'
                  ? 'Explore os cargos publicados e cadastre seu currículo no portal de carreiras.'
                  : 'Conheça o grupo e fale com nossa equipe sobre as possibilidades nesta empresa.'}
              </p>
            </div>
            <Link
              className={styles.button}
              href={company.slug === 'bebidas' ? '/carreiras' : '/contato'}
            >
              {company.slug === 'bebidas'
                ? 'Explorar carreiras'
                : 'Falar com o grupo'}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
        <section className={styles.otherCompanies} aria-labelledby="outras">
          <div className={styles.container}>
            <span className={styles.eyebrow} id="outras">
              Outras empresas do grupo
            </span>
            <HubBrandStrip current={company.slug} />
          </div>
        </section>
      </main>
      <HubFooter />
    </div>
  )
}
