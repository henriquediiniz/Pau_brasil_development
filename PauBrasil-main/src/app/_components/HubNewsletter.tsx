'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { HUB_COMPANIES, type HubNews } from '@/lib/hub-content'
import styles from './Hub.module.css'

const PHOTO_MS = 4000
/** Depois de um clique (campanha, seta, barrinha) a passagem espera um pouco antes de voltar. */
const CLICK_HOLD_MS = 6000

/**
 * Newsletter no topo da home: campanhas internas com fotos que passam sozinhas.
 * Cada foto fica PHOTO_MS na tela; ao fim das fotos de uma campanha, entra a próxima.
 * O tempo é contado como "decorrido": pausar (hover, foco de teclado, aba escondida, botão)
 * congela a foto e a barrinha, e retomar continua de onde parou em vez de recomeçar.
 * Desligada com movimento reduzido (WCAG 2.2.2).
 */
export function HubNewsletter({ items }: { items: HubNews[] }) {
  const [news, setNews] = useState(0)
  const [photo, setPhoto] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [clickHold, setClickHold] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [reduced, setReduced] = useState(false)
  // Tempo já decorrido da foto atual e início da contagem em andamento.
  const elapsed = useRef(0)
  const startedAt = useRef(0)
  const clickTimer = useRef<number>()
  const tabsRef = useRef<HTMLDivElement>(null)
  // Lista vazia vira um item vazio só para os hooks rodarem; o componente sai antes do JSX.
  const item = items[news] ?? { photos: [] as HubNews['photos'], company: '', slug: '' }
  const company = HUB_COMPANIES.find((c) => c.slug === item.company)
  const running =
    items.length > 0 && !paused && !hovered && !keyboardFocus && !clickHold && !hidden && !reduced
  // Próxima foto quando ela é de outra campanha: carregada escondida para a troca não piscar.
  const upcoming =
    items.length > 1 && photo === item.photos.length - 1
      ? items[(news + 1) % items.length].photos[0]
      : null

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const visibilidade = () => setHidden(document.hidden)
    visibilidade()
    document.addEventListener('visibilitychange', visibilidade)
    return () => {
      document.removeEventListener('visibilitychange', visibilidade)
      window.clearTimeout(clickTimer.current)
    }
  }, [])

  // Foto nova (automática ou por clique) zera o tempo decorrido.
  useEffect(() => {
    elapsed.current = 0
  }, [news, photo])

  // Agenda só o tempo que falta; ao pausar, guarda o que já passou.
  useEffect(() => {
    if (!running) return
    startedAt.current = Date.now()
    const timer = window.setTimeout(() => {
      elapsed.current = 0
      if (photo < item.photos.length - 1) setPhoto(photo + 1)
      else {
        setNews((news + 1) % items.length)
        setPhoto(0)
      }
    }, Math.max(0, PHOTO_MS - elapsed.current))
    return () => {
      window.clearTimeout(timer)
      elapsed.current = Math.min(PHOTO_MS, elapsed.current + Date.now() - startedAt.current)
    }
  }, [running, news, photo, item.photos.length, items.length])

  // A campanha ativa rola para dentro da faixa de botões (sem mexer na rolagem da página).
  useEffect(() => {
    const faixa = tabsRef.current
    const ativo = faixa?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!faixa || !ativo) return
    // Posição do botão dentro da faixa, medida na tela (offsetLeft depende do ancestral posicionado).
    const dentro = ativo.getBoundingClientRect().left - faixa.getBoundingClientRect().left + faixa.scrollLeft
    const alvo = dentro - (faixa.clientWidth - ativo.offsetWidth) / 2
    faixa.scrollTo({ left: Math.max(0, alvo), behavior: reduced ? 'auto' : 'smooth' })
  }, [news, reduced])

  /** Clique do usuário: segura a passagem por alguns segundos e depois volta sozinha. */
  const segurar = () => {
    setClickHold(true)
    window.clearTimeout(clickTimer.current)
    clickTimer.current = window.setTimeout(() => setClickHold(false), CLICK_HOLD_MS)
  }

  const select = (index: number) => {
    segurar()
    setNews(index)
    setPhoto(0)
  }

  const rolarFaixa = (direcao: 1 | -1) =>
    tabsRef.current?.scrollBy({ left: direcao * 240, behavior: reduced ? 'auto' : 'smooth' })

  // Avança/volta foto a foto; nas pontas, passa para a campanha vizinha.
  const step = (direction: 1 | -1) => {
    segurar()
    const next = photo + direction
    if (next >= 0 && next < item.photos.length) return setPhoto(next)
    const other = (news + direction + items.length) % items.length
    setNews(other)
    setPhoto(direction === 1 ? 0 : items[other].photos.length - 1)
  }

  const touchX = useRef<number | null>(null)

  if (!items.length) return null
  const current = items[news]

  return (
    <section
      id="newsletter"
      className={styles.newsletter}
      aria-labelledby="newsletter-title"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(event) => {
        // Só o foco de teclado pausa; o foco que sobra de um clique de mouse não.
        if (event.target.matches(':focus-visible')) setKeyboardFocus(true)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false)
      }}
    >
      <div className={`${styles.container} ${styles.newsGrid}`}>
        <div className={styles.newsCopy}>
          <span className={styles.eyebrow}>
            <span className={styles.newsLive} aria-hidden="true" /> Newsletter ·
            Acontece no grupo
          </span>
          <h2 id="newsletter-title" className={styles.srOnly}>
            Newsletter do Grupo Pau Brasil
          </h2>
          {/* key reinicia a entrada do texto a cada campanha */}
          <div key={current.slug} className={styles.newsText} aria-live="polite">
            <small>
              {current.date} · {company?.name} · {current.unit}
            </small>
            <h3>{current.title}</h3>
            <p>{current.summary}</p>
            {current.tagline && <em>{current.tagline}</em>}
          </div>
          <div className={styles.newsTabsRow}>
          <button
            type="button"
            className={styles.newsTabsScroll}
            onClick={() => rolarFaixa(-1)}
            aria-label="Ver campanhas anteriores"
            tabIndex={-1}
          >
            <ChevronLeft size={16} />
          </button>
          <div
            ref={tabsRef}
            className={styles.newsTabs}
            role="group"
            aria-label="Campanhas da newsletter"
          >
            {items.map((entry, index) => (
              <button
                key={entry.slug}
                type="button"
                aria-pressed={index === news}
                onClick={() => select(index)}
              >
                <small>{entry.date}</small>
                {entry.title}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.newsTabsScroll}
            onClick={() => rolarFaixa(1)}
            aria-label="Ver mais campanhas"
            tabIndex={-1}
          >
            <ChevronRight size={16} />
          </button>
            {!reduced && (
              <button
                type="button"
                className={styles.newsPause}
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? 'Retomar fotos da newsletter' : 'Pausar fotos da newsletter'}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}
          </div>
          <Link href="/newsletter" className={`${styles.textLink} ${styles.newsAllLink}`}>
            Ver todas as campanhas <ArrowRight size={16} />
          </Link>
        </div>
        <div
          className={styles.newsStage}
          role="group"
          aria-roledescription="carrossel"
          aria-label={`Fotos: ${current.title}`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') step(1)
            if (event.key === 'ArrowLeft') step(-1)
          }}
          onTouchStart={(event) => {
            touchX.current = event.touches[0].clientX
          }}
          onTouchEnd={(event) => {
            if (touchX.current === null) return
            const delta = event.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(delta) > 40) step(delta < 0 ? 1 : -1)
          }}
        >
          <div className={styles.newsBars}>
            {current.photos.map((entry, index) => (
              <button
                key={entry.src}
                type="button"
                data-state={index < photo ? 'done' : index === photo ? 'active' : 'next'}
                aria-label={`Foto ${index + 1} de ${current.photos.length}`}
                aria-current={index === photo}
                onClick={() => {
                  segurar()
                  setPhoto(index)
                }}
              >
                <span>
                  {/* Sempre montada: pausar congela a barrinha e retomar continua de onde parou. */}
                  {index === photo && !reduced && (
                    <i
                      key={`${news}-${photo}`}
                      style={{
                        animationDuration: `${PHOTO_MS}ms`,
                        animationPlayState: running ? 'running' : 'paused',
                      }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.newsArrow} ${styles.newsArrowPrev}`}
            onClick={() => step(-1)}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className={`${styles.newsArrow} ${styles.newsArrowNext}`}
            onClick={() => step(1)}
            aria-label="Próxima foto"
          >
            <ChevronRight size={20} />
          </button>
          <span className={styles.newsCounter} aria-hidden="true">
            {photo + 1} / {current.photos.length}
          </span>
          <div key={current.slug} className={styles.newsSlides}>
          {current.photos.map((entry, index) => (
            <figure
              key={entry.src}
              className={styles.newsSlide}
              data-active={index === photo}
              aria-hidden={index !== photo}
            >
              {/* Fundo desfocado da própria foto: fotos verticais não são cortadas nem ficam com faixas vazias */}
              <span
                className={styles.newsBlur}
                style={{ backgroundImage: `url(${entry.blur})` }}
              />
              <Image
                src={entry.src}
                alt={index === photo ? entry.alt : ''}
                width={entry.width}
                height={entry.height}
                sizes="(max-width: 800px) 100vw, 56vw"
                priority={news === 0 && index === 0}
              />
            </figure>
          ))}
          </div>
          {upcoming && (
            <Image
              key={upcoming.src}
              className={styles.newsPreload}
              src={upcoming.src}
              alt=""
              aria-hidden="true"
              width={upcoming.width}
              height={upcoming.height}
              sizes="(max-width: 800px) 100vw, 56vw"
            />
          )}
        </div>
      </div>
    </section>
  )
}
