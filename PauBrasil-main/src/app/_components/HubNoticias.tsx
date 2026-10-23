import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Briefcase, MapPin } from 'lucide-react'
import type { carregarNoticiasGerais } from '@/lib/endomarketing'
import styles from './Hub.module.css'

type Noticias = Awaited<ReturnType<typeof carregarNoticiasGerais>>

const desde = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Fortaleza' }).replace('.', '')

/** Notícias gerais da home: avisos fixos (cadastrados em /gente/endomarketing) + vagas abertas. */
export function HubNoticias({ avisos, vagas, totalVagas }: Noticias) {
  if (!avisos.length && !vagas.length) return null
  return (
    <section id="noticias" className={`${styles.section} ${styles.noticiasSection}`} aria-labelledby="noticias-titulo">
      <div className={styles.container}>
        <div className={styles.sectionHeading} data-reveal>
          <div>
            <span className={styles.eyebrow}>Notícias gerais</span>
            <h2 id="noticias-titulo">
              Fique por dentro
              <br />
              do que acontece.
            </h2>
          </div>
          <p>Comunicados do grupo e as oportunidades abertas agora nas nossas empresas.</p>
        </div>
        <div className={styles.noticiasGrid}>
          {avisos.length > 0 && (
            <ul className={styles.avisos}>
              {avisos.map((a) => (
                <li key={a.id} data-destaque={a.destaque} data-reveal>
                  <h3>{a.title}</h3>
                  <p>{a.texto}</p>
                  {a.link && (
                    a.link.startsWith('/') ? (
                      <Link href={a.link} className={styles.textLink}>
                        {a.linkLabel || 'Saiba mais'} <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <a href={a.link} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                        {a.linkLabel || 'Saiba mais'} <ArrowUpRight size={16} />
                      </a>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
          {vagas.length > 0 && (
            <div className={styles.vagasBox} data-reveal>
              <div className={styles.vagasHead}>
                <Briefcase size={18} />
                <strong>Vagas abertas</strong>
                <span>{totalVagas} {totalVagas === 1 ? 'oportunidade' : 'oportunidades'}</span>
              </div>
              <ul>
                {vagas.map((v) => (
                  <li key={`${v.cargo}-${v.unidade}`}>
                    <div>
                      <strong>{v.cargo}</strong>
                      <small>
                        {v.unidade && (<><MapPin size={12} /> {v.unidade} · </>)}desde {desde(v.desde)}
                      </small>
                    </div>
                    {v.quantidade > 1 && <span className={styles.vagasQtd}>{v.quantidade} vagas</span>}
                  </li>
                ))}
              </ul>
              <Link href="/carreiras/candidatar" className={styles.button}>
                Cadastrar meu currículo <ArrowUpRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
