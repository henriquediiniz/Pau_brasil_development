'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Clock, GraduationCap, Lock, X } from 'lucide-react'
import styles from '@/app/_components/Hub.module.css'

// videoUrl é intencionalmente excluído deste tipo — jamais chega ao componente
interface Episodio {
  id: string
  titulo: string
  descricao: string | null
  duracaoMin: number
  ordem: number
}

interface Temporada {
  id: string
  titulo: string
  descricao: string | null
  capa: string | null
  episodios: Episodio[]
}

const minutos = (t: Temporada) => t.episodios.reduce((acc, e) => acc + e.duracaoMin, 0)

/** Capa do curso; sem imagem cadastrada, um fundo vinho com o ícone da Universidade. */
function Capa({ temporada, sizes }: { temporada: Temporada; sizes: string }) {
  if (temporada.capa) {
    return <Image src={temporada.capa} alt="" fill unoptimized sizes={sizes} className={styles.upbCoverImg} />
  }
  return (
    <span className={styles.upbCoverFallback} aria-hidden="true">
      <GraduationCap size={34} strokeWidth={1.4} />
    </span>
  )
}

export function CatalogoPublico({ temporadas }: { temporadas: Temporada[] }) {
  const [selecionada, setSelecionada] = useState<Temporada | null>(null)

  useEffect(() => {
    if (!selecionada) return
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setSelecionada(null)
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [selecionada])

  return (
    <>
      <ul className={styles.upbGrid}>
        {temporadas.map((t) => (
          <li key={t.id} data-reveal>
            <button type="button" className={styles.upbCard} onClick={() => setSelecionada(t)}>
              <span className={styles.upbCover}>
                <Capa temporada={t} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px" />
                <span className={styles.upbBadge}>
                  {t.episodios.length} {t.episodios.length === 1 ? 'episódio' : 'episódios'}
                </span>
                <span className={styles.upbLock} aria-hidden="true">
                  <Lock size={15} />
                </span>
              </span>
              <span className={styles.upbBody}>
                <strong>{t.titulo}</strong>
                {t.descricao && <span className={styles.upbDesc}>{t.descricao}</span>}
                <span className={styles.upbMeta}>
                  {minutos(t) > 0 && (
                    <>
                      <Clock size={13} /> {minutos(t)} min de conteúdo
                    </>
                  )}
                  <span className={styles.companyArrow} aria-hidden="true">
                    <ArrowUpRight size={16} />
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selecionada && (
        <div className={styles.upbOverlay} onClick={() => setSelecionada(null)}>
          <div
            className={styles.upbModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upb-modal-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.upbModalCover}>
              <Capa temporada={selecionada} sizes="520px" />
              <div className={styles.upbModalShade}>
                <h3 id="upb-modal-titulo">{selecionada.titulo}</h3>
                {selecionada.descricao && <p>{selecionada.descricao}</p>}
              </div>
              <button
                type="button"
                className={styles.upbClose}
                onClick={() => setSelecionada(null)}
                aria-label="Fechar"
                autoFocus
              >
                <X size={16} />
              </button>
            </div>
            <ol className={styles.upbEpisodes}>
              {selecionada.episodios.slice(0, 6).map((ep, i) => (
                <li key={ep.id}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <strong>{ep.titulo}</strong>
                  <small>{ep.duracaoMin} min</small>
                  <Lock size={13} aria-label="Exclusivo para colaboradores" />
                </li>
              ))}
            </ol>
            {selecionada.episodios.length > 6 && (
              <p className={styles.upbMore}>
                +{selecionada.episodios.length - 6}{' '}
                {selecionada.episodios.length - 6 === 1 ? 'episódio' : 'episódios'}
              </p>
            )}
            <div className={styles.upbModalCta}>
              <Link href="/login?callbackUrl=%2Funiversidade" className={styles.button}>
                Entrar para assistir <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
