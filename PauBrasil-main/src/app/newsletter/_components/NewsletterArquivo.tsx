'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react'
import { HUB_COMPANIES, type HubNews } from '@/lib/hub-content'
import styles from '@/app/_components/Hub.module.css'

const nomeEmpresa = (slug: string) => HUB_COMPANIES.find((c) => c.slug === slug)?.name ?? slug

/** Arquivo completo da newsletter: filtro por empresa e galeria em tela cheia por campanha. */
export function NewsletterArquivo({ campanhas }: { campanhas: HubNews[] }) {
  const empresas = useMemo(() => Array.from(new Set(campanhas.map((c) => c.company))), [campanhas])
  const [empresa, setEmpresa] = useState('todas')
  const [aberta, setAberta] = useState<HubNews | null>(null)
  const [foto, setFoto] = useState(0)
  const lista = campanhas.filter((c) => empresa === 'todas' || c.company === empresa)

  useEffect(() => {
    if (!aberta) return
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberta(null)
      if (e.key === 'ArrowRight') setFoto((f) => (f + 1) % aberta.photos.length)
      if (e.key === 'ArrowLeft') setFoto((f) => (f - 1 + aberta.photos.length) % aberta.photos.length)
    }
    window.addEventListener('keydown', teclas)
    return () => window.removeEventListener('keydown', teclas)
  }, [aberta])

  if (!campanhas.length) {
    return (
      <div className={styles.emptyState}>
        <Images size={28} />
        <h3>Em breve.</h3>
        <p>As primeiras campanhas estão sendo cadastradas.</p>
      </div>
    )
  }

  const atual = aberta?.photos[foto]

  return (
    <>
      {empresas.length > 1 && (
        <div className={styles.filters} role="group" aria-label="Filtrar por empresa">
          <button type="button" aria-pressed={empresa === 'todas'} onClick={() => setEmpresa('todas')}>
            Todas <span className={styles.filterCount}>{campanhas.length}</span>
          </button>
          {empresas.map((slug) => (
            <button key={slug} type="button" aria-pressed={empresa === slug} onClick={() => setEmpresa(slug)}>
              {nomeEmpresa(slug)}
              <span className={styles.filterCount}>{campanhas.filter((c) => c.company === slug).length}</span>
            </button>
          ))}
        </div>
      )}
      <ul className={styles.upbGrid}>
        {lista.map((c) => (
          <li key={c.slug}>
            <button type="button" className={styles.upbCard} onClick={() => { setAberta(c); setFoto(0) }}>
              <span className={styles.upbCover}>
                <Image src={c.photos[0].src} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px" className={styles.upbCoverImg} />
                <span className={styles.upbBadge}>
                  {c.photos.length} {c.photos.length === 1 ? 'foto' : 'fotos'}
                </span>
              </span>
              <span className={styles.upbBody}>
                <span className={styles.nlDate}>{c.date} · {c.unit}</span>
                <strong>{c.title}</strong>
                <span className={styles.upbDesc}>{c.summary}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {aberta && atual && (
        <div className={styles.upbOverlay} onClick={() => setAberta(null)}>
          <div className={styles.nlLightbox} role="dialog" aria-modal="true" aria-labelledby="nl-titulo" onClick={(e) => e.stopPropagation()}>
            <div className={styles.nlLightboxStage}>
              <span className={styles.newsBlur} style={{ backgroundImage: `url(${atual.blur})` }} />
              <Image key={atual.src} src={atual.src} alt={atual.alt} fill sizes="(max-width: 900px) 100vw, 900px" className={styles.nlLightboxImg} />
              {aberta.photos.length > 1 && (
                <>
                  <button type="button" className={`${styles.newsArrow} ${styles.newsArrowPrev}`} style={{ opacity: 1 }}
                    onClick={() => setFoto((f) => (f - 1 + aberta.photos.length) % aberta.photos.length)} aria-label="Foto anterior">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" className={`${styles.newsArrow} ${styles.newsArrowNext}`} style={{ opacity: 1 }}
                    onClick={() => setFoto((f) => (f + 1) % aberta.photos.length)} aria-label="Próxima foto">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              <span className={styles.newsCounter}>{foto + 1} / {aberta.photos.length}</span>
              <button type="button" className={styles.upbClose} onClick={() => setAberta(null)} aria-label="Fechar" autoFocus>
                <X size={16} />
              </button>
            </div>
            <div className={styles.nlLightboxText}>
              <span className={styles.nlDate}>{aberta.date} · {nomeEmpresa(aberta.company)} · {aberta.unit}</span>
              <h3 id="nl-titulo">{aberta.title}</h3>
              <p>{aberta.summary}</p>
              {aberta.tagline && <em>{aberta.tagline}</em>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
