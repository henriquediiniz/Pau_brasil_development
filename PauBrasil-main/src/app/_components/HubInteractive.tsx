'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type RefObject,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Pause,
  Play,
  Search,
} from 'lucide-react'
import {
  HUB_COMPANIES,
  HUB_ERAS,
  HUB_FEATURED,
  HUB_INTERESTS,
  hubCompanyHref,
  suggestHubCompanies,
  type HubCompany,
} from '@/lib/hub-content'
import styles from './Hub.module.css'

/** Link para a empresa: abre o site próprio em nova aba quando existir. */
function CompanyLink({
  company,
  ...props
}: { company: HubCompany } & Omit<ComponentProps<typeof Link>, 'href'>) {
  const href = hubCompanyHref(company)
  if (company.externalUrl)
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
  return <Link href={href} {...props} />
}

/** Placa de marca: logo real sobre a cor da própria marca, ou monograma enquanto não há arquivo aprovado. */
export function BrandPlate({
  company,
  size = 'card',
}: {
  company: HubCompany
  size?: 'card' | 'mini' | 'hero'
}) {
  const sizes =
    size === 'hero'
      ? '(max-width: 800px) 220px, 300px'
      : size === 'mini'
        ? '56px'
        : '(max-width: 600px) 45vw, (max-width: 1100px) 30vw, 260px'
  return (
    <span
      className={`${styles.brandPlateBox} ${styles[`plate_${size}`]}`}
      style={{ background: company.plate }}
      data-shape={company.logo?.shape ?? 'monogram'}
    >
      {company.logo ? (
        <Image
          src={company.logo.src}
          // Nos cards e na faixa o nome já aparece ao lado; o logo é decorativo.
          alt={size === 'hero' ? `Logo ${company.name}` : ''}
          fill
          sizes={sizes}
          className={styles.plateLogo}
        />
      ) : (
        <span className={styles.plateMonogram} aria-hidden="true">
          {company.monogram}
        </span>
      )}
    </span>
  )
}

export function HubCompanies() {
  const [filter, setFilter] = useState('Todos')
  const counts = HUB_COMPANIES.reduce<Record<string, number>>((acc, c) => {
    acc[c.segment] = (acc[c.segment] ?? 0) + 1
    return acc
  }, {})
  const segments = ['Todos', ...Object.keys(counts)]
  const companies = HUB_COMPANIES.filter(
    (company) => filter === 'Todos' || company.segment === filter,
  )
  const showFeatured = filter === 'Todos'
  return (
    <>
      <div
        className={styles.filters}
        role="group"
        aria-label="Filtrar empresas por segmento"
      >
        {segments.map((segment) => (
          <button
            key={segment}
            type="button"
            aria-pressed={filter === segment}
            onClick={() => setFilter(segment)}
          >
            {segment}
            <span className={styles.filterCount} aria-hidden="true">
              {segment === 'Todos' ? HUB_COMPANIES.length : counts[segment]}
            </span>
          </button>
        ))}
      </div>
      <p className={styles.srOnly} role="status">
        {companies.length}{' '}
        {companies.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
      </p>
      <ul className={styles.companyGrid}>
        {companies.map((company) => {
          const featured =
            showFeatured &&
            (HUB_FEATURED as readonly string[]).includes(company.slug)
          return (
            <li
              key={company.slug}
              className={featured ? styles.companyFeatured : undefined}
            >
              <CompanyLink
                company={company}
                className={styles.companyCard}
              >
                <BrandPlate company={company} />
                <div className={styles.companyBody}>
                  <div className={styles.companyTop}>
                    <span>{company.segment}</span>
                    {company.partner && (
                      <span className={styles.partnerTag}>
                        Parceiro {company.partner}
                      </span>
                    )}
                  </div>
                  <h3>{company.name}</h3>
                  <p>{company.description}</p>
                  <span className={styles.companyMore}>
                    <span>
                      {company.units.length > 0
                        ? `${company.units.length} ${company.units.length === 1 ? 'unidade' : 'unidades'}`
                        : 'Conhecer a empresa'}
                    </span>
                    <span className={styles.companyArrow} aria-hidden="true">
                      <ArrowUpRight size={18} />
                    </span>
                  </span>
                </div>
              </CompanyLink>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** Faixa de marcas: atalho direto para cada empresa do grupo. */
export function HubBrandStrip({
  current,
  variant = 'pills',
}: {
  current?: string
  variant?: 'pills' | 'stacked'
}) {
  const items = HUB_COMPANIES.filter((c) => c.slug !== current)
  return (
    <ul
      className={`${styles.brandStrip} ${variant === 'stacked' ? styles.brandStripStacked : ''}`}
    >
      {items.map((company) => (
        <li key={company.slug}>
          <CompanyLink company={company} title={company.name}>
            <BrandPlate company={company} size="mini" />
            <span>{company.name}</span>
          </CompanyLink>
        </li>
      ))}
    </ul>
  )
}

/** Tempo de cada ano em destaque: acompanha o tamanho do texto (um fato curto não espera tanto quanto três). */
const yearMs = (events: string[]) =>
  Math.min(8000, Math.max(4000, 2500 + events.join(' ').length * 30))

// useLayoutEffect desenha a estrada antes da pintura; no servidor cai para useEffect, sem aviso.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

type RoadShape = { width: number; height: number; d: string; pins: [number, number][] }

/** Curva suave (Catmull-Rom convertida em Bézier) passando por todos os pontos. */
function smoothPath(points: [number, number][]) {
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const t = 1 / 6
    d += ` C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/**
 * Estrada sinuosa ao lado dos anos: mede a posição de cada ano e passa por todos, alternando os lados.
 * Fica numa faixa estreita à esquerda, então nunca corta a tela nem pede rolagem horizontal.
 */
function EraRoad({ list, era, year }: { list: RefObject<HTMLOListElement>; era: number; year: number }) {
  const [shape, setShape] = useState<RoadShape | null>(null)
  const road = useRef<SVGPathElement>(null)
  const truck = useRef<SVGGElement>(null)
  // Onde o caminhão está na estrada (comprimento percorrido); null até a primeira viagem.
  const at = useRef<number | null>(null)

  useBeforePaint(() => {
    const element = list.current
    if (!element) return
    const draw = () => {
      const width = parseFloat(getComputedStyle(element).getPropertyValue('--road')) || 110
      const height = element.offsetHeight
      const top = element.getBoundingClientRect().top
      const left = width * 0.3
      const right = width * 0.68
      const pins = Array.from(element.querySelectorAll<HTMLElement>('[data-year]')).map(
        (year, index): [number, number] => {
          const box = year.getBoundingClientRect()
          return [index % 2 ? right : left, box.top - top + box.height / 2 + 12]
        },
      )
      if (!pins.length) return setShape(null)
      const first = pins[0]
      const last = pins[pins.length - 1]
      setShape({
        width,
        height,
        pins,
        // Entra e sai na mesma coluna do primeiro e do último pino, sem curva sobrando nas pontas.
        d: smoothPath([[first[0], 0], ...pins, [last[0], height]]),
      })
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(element)
    return () => observer.disconnect()
  }, [list, era])

  // Caminhãozinho: dirige pela estrada até logo depois do alfinete do ano em destaque.
  // O painel remonta a cada era (key), então cada era começa com ele entrando pelo topo.
  useEffect(() => {
    const path = road.current
    const body = truck.current
    if (!shape || !path || !body) return
    const total = path.getTotalLength()
    // Comprimento da estrada em cada alfinete: o ponto amostrado mais próximo (a curva passa por eles).
    const samples: [number, number, number][] = []
    for (let length = 0; length <= total; length += 2) {
      const point = path.getPointAtLength(length)
      samples.push([length, point.x, point.y])
    }
    const lengthAt = ([x, y]: [number, number]) =>
      samples.reduce(
        (best, [length, px, py]) => {
          const distance = (px - x) ** 2 + (py - y) ** 2
          return distance < best.distance ? { distance, length } : best
        },
        { distance: Infinity, length: 0 },
      ).length
    const lane = shape.width >= 100 ? 24 : 18
    // Para um pouco depois do alfinete: a cabeça do alfinete fica acima do ponto e não cobre o caminhão.
    const target = Math.min(total - 1, lengthAt(shape.pins[year]) + lane + 6)
    const from = at.current ?? 0
    const place = (length: number, reverse: boolean) => {
      const point = path.getPointAtLength(length)
      const ahead = path.getPointAtLength(Math.min(total, length + 1))
      const behind = path.getPointAtLength(Math.max(0, length - 1))
      let angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI
      if (reverse) angle += 180
      body.setAttribute('transform', `translate(${point.x.toFixed(1)},${point.y.toFixed(1)}) rotate(${angle.toFixed(1)})`)
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || Math.abs(target - from) < 1) {
      at.current = target
      return place(target, false)
    }
    const reverse = target < from
    const duration = Math.min(1600, 500 + Math.abs(target - from) * 4)
    // Na primeira viagem espera a estrada terminar de aparecer.
    const delay = at.current === null ? 900 : 0
    let frame = 0
    let start: number | undefined
    const tick = (now: number) => {
      start ??= now
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      at.current = from + (target - from) * eased
      place(at.current, reverse)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    place(from, reverse)
    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(tick)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [shape, year])

  if (!shape) return null
  const lane = shape.width >= 100 ? 24 : 18
  return (
    <svg
      className={styles.eraRoad}
      viewBox={`0 0 ${shape.width} ${shape.height}`}
      width={shape.width}
      height={shape.height}
      aria-hidden="true"
    >
      <path d={shape.d} fill="none" stroke="#e2d6c8" strokeWidth={lane + 10} strokeLinecap="round" />
      <path ref={road} d={shape.d} fill="none" stroke="#353130" strokeWidth={lane} strokeLinecap="round" />
      <path d={shape.d} fill="none" stroke="#eadfcd" strokeWidth={2} strokeDasharray="9 8" />
      {/* Caminhão visto de cima, apontando para +x; o transform do grupo externo vem do efeito acima.
          Fica antes dos alfinetes, que passam por cima dele. */}
      <g ref={truck} className={styles.eraTruck} transform="translate(-100,-100)">
        <g transform={`scale(${lane / 24})`}>
          <rect x={-14} y={-6} width={30} height={14} rx={3} fill="#000" opacity={0.22} />
          <rect x={-16} y={-7} width={21} height={14} rx={2} fill="#faf9f6" stroke="#1a1a1a" strokeWidth={0.8} />
          <rect x={-16} y={-1.3} width={21} height={2.6} fill="var(--wine)" />
          <rect x={6} y={-6.2} width={9} height={12.4} rx={2.6} fill="var(--wine)" />
          <rect x={11} y={-4.6} width={2.6} height={9.2} rx={1} fill="#dcc8b1" />
        </g>
      </g>
      {shape.pins.map(([x, y], index) => (
        <g key={index} className={styles.eraPin} style={{ '--i': index } as CSSProperties}>
          {/* Grupo interno: a escala do alfinete ativo não briga com a animação de queda do externo */}
          <g
            className={styles.eraPinShape}
            data-active={index === year}
            style={{ transformOrigin: `${x}px ${y + 2}px` }}
          >
            {index === year && <circle className={styles.eraPinPulse} cx={x} cy={y - 21} r={11} />}
            <path
              d={`M${x},${y + 2} L${x - 8.3},${y - 14} A11,11 0 1 1 ${x + 8.3},${y - 14} Z`}
              fill="var(--wine)"
            />
            <circle cx={x} cy={y - 21} r={4.2} fill="#fff" />
          </g>
        </g>
      ))}
    </svg>
  )
}

/**
 * Linha do tempo do grupo, dividida em eras; cada era lista os anos e as empresas citadas.
 * Um ano fica em destaque por vez e a passagem avança ano a ano (e de era em era) enquanto
 * a seção está na tela. Pausa no botão e no foco de teclado; não pausa no hover, que no
 * celular travava a passagem (o toque não gera "mouse saiu"), como acontecia na newsletter.
 */
export function HubTimeline() {
  const [active, setActive] = useState(0)
  const [year, setYear] = useState(0)
  const [paused, setPaused] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  // Tempo já decorrido do ano atual: pausar e retomar continua de onde parou, junto com a barrinha.
  const elapsed = useRef(0)
  const startedAt = useRef(0)
  const era = HUB_ERAS[active]
  const last = HUB_ERAS.length - 1
  const lastYear = era.years.length - 1
  const running = visible && !paused && !keyboardFocus && !reduced
  const duration = yearMs(era.years[year].events)

  const selectEra = (index: number) => {
    setActive(index)
    setYear(0)
  }
  // Setas andam ano a ano; nas pontas da era passam para a vizinha.
  const step = (direction: 1 | -1) => {
    const next = year + direction
    if (next >= 0 && next <= lastYear) return setYear(next)
    const other = active + direction
    if (other < 0 || other > last) return
    setActive(other)
    setYear(direction === 1 ? 0 : HUB_ERAS[other].years.length - 1)
  }

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const element = root.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Ano novo (sozinho ou por clique) zera o decorrido; declarado antes do timer para rodar primeiro.
  useEffect(() => {
    elapsed.current = 0
  }, [active, year])

  // Agenda só o que falta do ano; ao pausar, guarda o que já passou.
  useEffect(() => {
    if (!running) return
    startedAt.current = Date.now()
    const timer = window.setTimeout(() => {
      elapsed.current = 0
      if (year < lastYear) return setYear(year + 1)
      setActive(active === last ? 0 : active + 1)
      setYear(0)
    }, Math.max(0, duration - elapsed.current))
    return () => {
      window.clearTimeout(timer)
      elapsed.current = Math.min(duration, elapsed.current + Date.now() - startedAt.current)
    }
  }, [running, active, year, lastYear, last, duration])

  return (
    <div
      ref={root}
      className={styles.storyTimeline}
      data-running={running}
      data-spotlight={!reduced}
      onFocus={(event) => {
        // Só o foco de teclado pausa; o botão de pausa tem estado próprio e não segura o play.
        if (event.target.matches(':focus-visible') && !event.target.matches('[data-era-toggle]'))
          setKeyboardFocus(true)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false)
      }}
    >
      <div
        className={styles.timelineSteps}
        role="group"
        aria-label="Eras da história do grupo"
      >
        {HUB_ERAS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={active === index}
            aria-controls="story-content"
            onClick={() => selectEra(index)}
          >
            <span className={styles.timelineDot} />
            <small>{item.range}</small>
            {item.label}
            {/* Enche ano a ano: parte do trecho já percorrido e anima só o ano atual.
                key remonta junto com o timer, então os dois ficam em sincronia. */}
            {active === index && !reduced && (
              <span
                key={`${active}-${year}`}
                className={styles.eraProgress}
                style={
                  {
                    '--from': year / era.years.length,
                    '--to': (year + 1) / era.years.length,
                    animationDuration: `${duration}ms`,
                    animationPlayState: running ? 'running' : 'paused',
                  } as CSSProperties
                }
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>
      {/* key remonta o painel a cada troca de era, reiniciando a entrada em cascata */}
      <div id="story-content" className={styles.eraPanel} key={active}>
        <div className={styles.eraIntro}>
          <span className={styles.eraRange}>{era.range}</span>
          <h3>{era.title}</h3>
          <p>{era.summary}</p>
          <div className={styles.eraNav}>
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={active === 0 && year === 0}
              aria-label="Ano anterior"
            >
              <ArrowLeft size={17} />
            </button>
            <span aria-label={`Ano ${year + 1} de ${era.years.length} desta era`}>
              {era.years[year].year}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={active === last && year === lastYear}
              aria-label="Próximo ano"
            >
              <ArrowRight size={17} />
            </button>
            {!reduced && (
              <button
                type="button"
                className={styles.eraPause}
                data-era-toggle
                onClick={() => {
                  // Play é uma ordem explícita: libera também a pausa do foco de teclado.
                  if (paused) setKeyboardFocus(false)
                  setPaused(!paused)
                }}
                aria-label={paused ? 'Retomar passagem automática' : 'Pausar passagem automática'}
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
              </button>
            )}
          </div>
        </div>
        <div className={styles.eraTrack}>
        <ol ref={list} className={styles.eraYears}>
          {HUB_ERAS[active].years.map((item, index) => (
            <li
              key={item.year}
              style={{ '--i': index } as CSSProperties}
              data-active={index === year}
              // Clique em qualquer parte do ano também o destaca; o teclado usa o botão do número.
              onClick={() => setYear(index)}
            >
              <button
                type="button"
                className={styles.eraYear}
                data-year
                aria-pressed={index === year}
                aria-label={`Destacar ${item.year}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setYear(index)
                }}
              >
                {item.year}
              </button>
              <div>
                <ul>
                  {item.events.map((event) => {
                    const award = event.startsWith('*')
                    return (
                      <li key={event} className={award ? styles.eraAward : undefined}>
                        {award && <span className={styles.srOnly}>Reconhecimento: </span>}
                        {award ? event.slice(1) : event}
                      </li>
                    )
                  })}
                </ul>
                {item.companies && (
                  <div className={styles.eraBrands}>
                    {item.companies.map((slug) => {
                      const company = HUB_COMPANIES.find((c) => c.slug === slug)
                      if (!company) return null
                      return (
                        <span key={slug} title={company.name}>
                          <BrandPlate company={company} size="mini" />
                          <span className={styles.srOnly}>{company.name}</span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
        {/* Depois da lista de propósito: o ref da lista precisa estar ligado quando a estrada mede os anos.
            Em desenvolvimento o StrictMode remonta e mascarava isso; em produção a estrada não aparecia. */}
        <EraRoad list={list} era={active} year={year} />
        </div>
      </div>
    </div>
  )
}

export function HubTalentGuide() {
  const [interest, setInterest] = useState('')
  const [submitted, setSubmitted] = useState('')
  const companies = suggestHubCompanies(submitted)
  return (
    <div className={styles.talentGuide}>
      <span className={styles.eyebrow}>Encontre seu caminho</span>
      <h3>O que move você?</h3>
      <p>
        Escolha uma área de interesse e descubra negócios do grupo para
        conhecer.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(interest)
        }}
      >
        <label htmlFor="hub-interest">Sua área de interesse</label>
        <select
          id="hub-interest"
          value={interest}
          required
          onChange={(event) => {
            setInterest(event.target.value)
            setSubmitted('')
          }}
        >
          <option value="" disabled>
            Selecione uma área
          </option>
          {HUB_INTERESTS.map((item) => (
            <option value={item.id} key={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button className={styles.button} type="submit">
          Explorar possibilidades <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>
      <div role="status" aria-live="polite" aria-atomic="true">
        {submitted && (
          <div className={styles.talentResult}>
            <strong>Negócios para você conhecer</strong>
            <p>{HUB_INTERESTS.find((item) => item.id === submitted)?.reason}</p>
            {companies.map((company) => (
              <CompanyLink company={company} key={company.slug}>
                <BrandPlate company={company} size="mini" />
                <span>{company.name}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </CompanyLink>
            ))}
            <small>
              Esta orientação usa apenas o interesse escolhido. Não é uma oferta
              de vaga nem envia uma candidatura. O cadastro de currículo é feito
              no portal de carreiras.
            </small>
          </div>
        )}
      </div>
    </div>
  )
}

const STATE_NAMES: Record<string, string> = {
  PB: 'Paraíba',
  PE: 'Pernambuco',
  BA: 'Bahia',
}

export function HubUnits({ company }: { company: HubCompany }) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState('Todos')
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  const units = company.units.filter(
    (unit) =>
      (state === 'Todos' || unit.state === state) &&
      normalize(unit.name).includes(normalize(query)),
  )
  if (!company.units.length)
    return (
      <div className={styles.emptyState}>
        <MapPin size={28} />
        <h3>Novos endereços em breve.</h3>
        <p>
          Estamos preparando a relação de unidades desta empresa. Para
          informações de atendimento, fale com o grupo.
        </p>
        <Link href="/contato" className={styles.textLink}>
          Entrar em contato <ArrowRight size={16} />
        </Link>
      </div>
    )
  return (
    <>
      <div className={styles.unitControls}>
        <label className={styles.search}>
          <Search size={18} />
          <span className={styles.srOnly}>Buscar unidade por cidade</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cidade"
            type="search"
          />
        </label>
        <div
          className={styles.filters}
          role="group"
          aria-label="Filtrar unidades por estado"
        >
          {[
            'Todos',
            ...Array.from(new Set(company.units.map((unit) => unit.state))),
          ].map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={state === item}
              onClick={() => setState(item)}
            >
              {item === 'Todos' ? 'Todos os estados' : item}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.unitCount} role="status">
        {units.length}{' '}
        {units.length === 1 ? 'unidade encontrada' : 'unidades encontradas'}
      </p>
      <div className={styles.unitGrid}>
        {units.map((unit) => (
          <article key={unit.name}>
            <MapPin size={21} />
            <div>
              <h3>{unit.name}</h3>
              <p>{STATE_NAMES[unit.state] ?? unit.state}</p>
            </div>
            <span>{unit.state}</span>
          </article>
        ))}
      </div>
      {!units.length && (
        <div className={styles.emptyState}>
          <p>Nenhuma unidade encontrada para essa busca.</p>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => {
              setQuery('')
              setState('Todos')
            }}
          >
            Limpar filtros <ArrowRight size={16} />
          </button>
        </div>
      )}
      <p className={styles.contentNote}>
        Relação inicial baseada no cadastro do portal. Endereços e contatos das
        unidades serão adicionados após confirmação.
      </p>
    </>
  )
}
