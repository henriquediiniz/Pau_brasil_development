'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  MapPin,
  Search,
} from 'lucide-react'
import {
  HUB_COMPANIES,
  HUB_INTERESTS,
  HUB_STORY,
  suggestHubCompanies,
  type HubCompany,
} from '@/lib/hub-content'
import styles from './Hub.module.css'

export function HubCompanies() {
  const [filter, setFilter] = useState('Todos')
  const segments = [
    'Todos',
    ...Array.from(new Set(HUB_COMPANIES.map((company) => company.segment))),
  ]
  const companies = HUB_COMPANIES.filter(
    (company) => filter === 'Todos' || company.segment === filter,
  )
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
          </button>
        ))}
      </div>
      <p className={styles.srOnly} role="status">
        {companies.length} empresas encontradas
      </p>
      <div className={styles.companyGrid}>
        {companies.map((company) => (
          <Link
            href={`/empresas/${company.slug}`}
            key={company.slug}
            className={styles.companyCard}
          >
            <div className={styles.companyTop}>
              <span>{company.segment}</span>
              <ArrowUpRight size={22} aria-hidden="true" />
            </div>
            <div className={styles.companyIdentity}>
              <Building2 size={27} strokeWidth={1.3} aria-hidden="true" />
              {company.partner && <span>{company.partner}</span>}
            </div>
            <h3>{company.name}</h3>
            <p>{company.description}</p>
            <span className={styles.companyMore}>
              Conhecer a empresa <ArrowRight size={17} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}

export function HubStory() {
  const [active, setActive] = useState(0)
  const story = HUB_STORY[active]
  return (
    <div className={styles.storyTimeline}>
      <div
        className={styles.timelineSteps}
        role="group"
        aria-label="Capítulos da história do grupo"
      >
        {HUB_STORY.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={active === index}
            aria-controls="story-content"
            onClick={() => setActive(index)}
          >
            <span className={styles.timelineDot} />
            <small>0{index + 1}</small>
            {item.label}
          </button>
        ))}
      </div>
      <div
        id="story-content"
        className={styles.storyPanel}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={styles.storyNumber} aria-hidden="true">
          0{active + 1}
        </span>
        <div>
          <h3>{story.title}</h3>
          <p>{story.text}</p>
          <small>{story.note}</small>
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
              <Link href={`/empresas/${company.slug}`} key={company.slug}>
                {company.name}
                <ArrowUpRight size={16} />
              </Link>
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
              <p>{unit.state === 'PB' ? 'Paraíba' : 'Bahia'}</p>
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
