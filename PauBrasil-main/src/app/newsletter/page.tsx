import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { ArrowLeft } from 'lucide-react'
import { HubFooter, HubNav } from '@/app/_components/HubShell'
import { HubReveal } from '@/app/_components/HubReveal'
import { NewsletterArquivo } from './_components/NewsletterArquivo'
import { listarNewsletterPublicada } from '@/lib/newsletter'
import styles from '@/app/_components/Hub.module.css'

const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-hub' })

export const metadata: Metadata = {
  title: { absolute: 'Newsletter · Grupo Pau Brasil' },
  description: 'Campanhas, homenagens e ações internas das empresas do Grupo Pau Brasil.',
  icons: { icon: '/icons/icon-192.png' },
}

export const viewport: Viewport = { colorScheme: 'only light' }

// Do banco; regerada a cada 5 min e na hora em que Gente publica (revalidatePath).
export const revalidate = 300

export default async function NewsletterPage() {
  const campanhas = await listarNewsletterPublicada(null)
  return (
    <div className={`${styles.hub} ${montserrat.variable}`} data-hub-root>
      <HubReveal />
      <HubNav />
      <main id="conteudo">
        <section className={styles.ngHero}>
          <div className={styles.container} data-reveal>
            <span className={styles.eyebrow}>Newsletter</span>
            <h1>
              Acontece no <em>grupo.</em>
            </h1>
            <p>
              Campanhas, homenagens e ações que movimentam as equipes das empresas do Grupo Pau
              Brasil ao longo do ano.
            </p>
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.container}>
            <Link href="/" className={`${styles.textLink} ${styles.nlBack}`}>
              <ArrowLeft size={16} /> Voltar para o início
            </Link>
            <NewsletterArquivo campanhas={campanhas} />
          </div>
        </section>
      </main>
      <HubFooter />
    </div>
  )
}
