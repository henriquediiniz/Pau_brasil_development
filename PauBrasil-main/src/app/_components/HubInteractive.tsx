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

const ERA_MS = 10000

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
function EraRoad({ list, era }: { list: RefObject<HTMLOListElement>; era: number }) {
  const [shape, setShape] = useState<RoadShape | null>(null)

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
      <path d={shape.d} fill="none" stroke="#353130" strokeWidth={lane} strokeLinecap="round" />
      <path d={shape.d} fill="none" stroke="#eadfcd" strokeWidth={2} strokeDasharray="9 8" />
      {shape.pins.map(([x, y], index) => (
        <g key={index} className={styles.eraPin} style={{ '--i': index } as CSSProperties}>
          <path
            d={`M${x},${y + 2} L${x - 8.3},${y - 14} A11,11 0 1 1 ${x + 8.3},${y - 14} Z`}
            fill="var(--wine)"
          />
          <circle cx={x} cy={y - 21} r={4.2} fill="#fff" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Linha do tempo do grupo, dividida em eras; cada era lista os anos e as empresas citadas.
 * As eras avançam sozinhas enquanto a seção está na tela, com pausa no hover, no foco e no botão.
 */
export function HubTimeline() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const era = HUB_ERAS[active]
  const last = HUB_ERAS.length - 1
  const running = visible && !paused && !held && !reduced

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

  // `active` nas dependências reinicia a contagem quando a era muda, inclusive por clique.
  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(
      () => setActive((index) => (index === last ? 0 : index + 1)),
      ERA_MS,
    )
    return () => window.clearTimeout(timer)
  }, [running, active, last])

  return (
    <div
      ref={root}
      className={styles.storyTimeline}
      data-running={running}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false)
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
            onClick={() => setActive(index)}
          >
            <span className={styles.timelineDot} />
            <small>{item.range}</small>
            {item.label}
            {/* Só existe enquanto a contagem roda: remonta junto com o timer e os dois ficam em sincronia */}
            {active === index && running && (
              <span
                className={styles.eraProgress}
                style={{ animationDuration: `${ERA_MS}ms` } as CSSProperties}
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
              onClick={() => setActive(active - 1)}
              disabled={active === 0}
              aria-label="Era anterior"
            >
              <ArrowLeft size={17} />
            </button>
            <span>
              {active + 1} / {HUB_ERAS.length}
            </span>
            <button
              type="button"
              onClick={() => setActive(active + 1)}
              disabled={active === last}
              aria-label="Próxima era"
            >
              <ArrowRight size={17} />
            </button>
            {!reduced && (
              <button
                type="button"
                className={styles.eraPause}
                onClick={() => setPaused((value) => !value)}
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
            >
              <span className={styles.eraYear} data-year>
                {item.year}
              </span>
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
        <EraRoad list={list} era={active} />
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
