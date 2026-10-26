'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { FileText, MapPin, Phone, Upload, User, Search, Briefcase, FileCheck2, ArrowLeft, ArrowRight, Loader2, Sparkles, X, CheckCircle2, ChevronDown, ChevronUp, Check, CheckSquare } from 'lucide-react'
import { CARREIRAS_GRUPOS } from '@/lib/carreiras-areas'
import { DescritivoCargo, type DescritivoPublico } from './_components/DescritivoCargo'
import type { CargoNaPagina, GrupoNaPagina } from '@/lib/gente/cargo-publico'
import { useAnalytics } from '@/hooks/useAnalytics'
import { saveDraft, loadDraft, clearDraft, migrateDraft } from '@/lib/draft-candidatura'
import { Montserrat } from 'next/font/google'
import { HubFooter, HubNav } from '@/app/_components/HubShell'
import hubStyles from '@/app/_components/Hub.module.css'
import { EmailsCurriculo } from '@/app/_components/EmailsCurriculo'
import { AvisoLgpd } from './_components/AvisoLgpd'
import {
  CV_MAX_BYTES, CV_MAX_TEXTO, ESCOLARIDADES, GENEROS, IDADE_MAXIMA, IDADE_MINIMA, idadeAceita, lerDataNascimento,
} from '@/lib/carreiras-perfil'

const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-hub' })

// ─── Constants ────────────────────────────────────────────────────────────────
const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
]

const MAX_CARGOS = 3

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  nome:        string
  email:       string
  telefone:    string
  cidade:      string
  estado:      string
  cargosInteresse: string[]
  cvFile:      File | null
  mensagem:    string
  consentimentoLgpd: boolean
  tiposVaga:   ('pcd' | 'mulheres')[]
  genero:         string
  /** "AAAA-MM-DD", como o input de data entrega. */
  dataNascimento: string
  escolaridade:   string
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const steps = [
    { icon: FileCheck2,  label: 'Currículo' },
    { icon: User,        label: 'Você' },
    { icon: Briefcase,   label: 'Cargos' },
  ]
  return (
    <div className="w-full max-w-sm mx-auto flex items-center gap-2 mb-8">
      {steps.map((s, i) => {
        const Icon = s.icon
        const active = i + 1 === step
        const done   = i + 1 < step
        return (
          <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
              ${done   ? 'bg-[#7a1520] text-white' :
                active ? 'bg-[#7a1520] text-white ring-4 ring-[#7a1520]/15' :
                         'bg-[#f1ebe3] text-[#6f5c4e]'}`}>
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            <span className={`text-xs font-medium truncate transition-colors hidden sm:block
              ${active ? 'text-[#1a1a1a]' : done ? 'text-[#7a1520]' : 'text-[#6f5c4e]'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 transition-colors ${done ? 'bg-[#7a1520]/40' : 'bg-[#f1ebe3]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Cargo Selector (Step 2) ──────────────────────────────────────────────────
function CargoSelector({ selected, recommended = [], onChange }: {
  selected: string[]
  recommended?: string[]
  onChange: (cargos: string[]) => void
}) {
  const [expandedGrupos, setExpandedGrupos] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [vendoDescritivo, setVendoDescritivo] = useState<DescritivoPublico | null>(null)

  /*
    Descritivos publicados pelo RH, indexados pelo nome do cargo.

    A lista de cargos continua vindo de CARREIRAS_GRUPOS. Trocar a fonte de uma
    vez deixaria a pagina quase vazia hoje — dos 40 cargos publicos, so 6 tem
    descritivo — e ninguem conseguiria se candidatar. Entao os dois convivem: o
    cargo que ja tem descritivo ganha "ver detalhes", os outros seguem como
    antes, e conforme o RH escreve os 34 que faltam eles acendem um a um.

    Se a rota falhar, o mapa fica vazio e a pagina funciona como sempre
    funcionou. Candidatura nao pode depender de uma chamada opcional.
  */
  /*
    O catalogo vem do servidor e e montado so com descritivos cadastrados.

    NAO ha mais plano B com a lista chumbada. Ate 2026-09-23 a falha da rota
    caia em CARREIRAS_GRUPOS, e isso virou armadilha: a validacao de envio
    passou a aceitar apenas o que o catalogo oferece, entao a lista de
    emergencia mostraria cargos que o servidor recusa. O candidato preencheria
    tudo e levaria erro no fim.

    Falhar visivel, e cedo, e melhor do que deixar terminar para recusar.
  */
  const [catalogo, setCatalogo] = useState<GrupoNaPagina[] | null>(null)
  const [falhouCatalogo, setFalhouCatalogo] = useState(false)

  useEffect(() => {
    let cancelado = false

    fetch('/api/carreiras/cargos')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d) => {
        if (cancelado) return
        if (!Array.isArray(d?.grupos)) throw new Error()
        setCatalogo(d.grupos)
      })
      .catch(() => { if (!cancelado) setFalhouCatalogo(true) })

    return () => { cancelado = true }
  }, [])

  const grupos: GrupoNaPagina[] = catalogo ?? []
  const { track } = useAnalytics()

  const toggleGrupo = (slug: string) => {
    setExpandedGrupos(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  const toggleCargo = (cargo: string) => {
    if (selected.includes(cargo)) {
      track('cargo_deselected', { cargo, totalSelected: selected.length - 1 })
      onChange(selected.filter(c => c !== cargo))
    } else if (selected.length < MAX_CARGOS) {
      track('cargo_selected', { cargo, totalSelected: selected.length + 1 })
      onChange([...selected, cargo])
    }
  }

  // Debounce para não spammar evento de busca a cada keystroke
  useEffect(() => {
    if (!searchQuery.trim()) return
    const t = setTimeout(() => {
      const found = CARREIRAS_GRUPOS.some(g =>
        g.grupo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.cargos.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      track('cargo_searched', { query: searchQuery, resultsFound: found })
    }, 800)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  return (
    <div className="space-y-3">
      {/* Chips selecionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#7a1520]/[0.05] border border-[#7a1520]/20">
          {selected.map(c => (
            <span key={c}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7a1520]/10 border border-[#7a1520]/30 text-[#7a1520] text-xs font-medium">
              {c}
              <button onClick={() => toggleCargo(c)} className="hover:text-[#7a1520] transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <span className="text-xs text-[#6f5c4e] self-center ml-auto">
            {selected.length}/{MAX_CARGOS} selecionados
          </span>
        </div>
      )}

      {/* Barra de Busca (Nova IA Focus) */}
      <div className="relative pt-1 pb-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search className="h-4 w-4 text-[#6f5c4e]" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar áreas ou vagas..." 
          className="w-full bg-white border border-[#d9cdbf] rounded-[6px] pl-9 pr-4 py-2.5 text-sm text-[#1a1a1a] placeholder-[#9a8c80] focus:outline-none focus:border-[#7a1520] focus:bg-white transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Lista de grupos filtrada ortogonal */}
      <div className="space-y-2">
        {(() => {
          const filteredGroups = grupos.filter(grupo => {
            if (!searchQuery.trim()) return true
            const q = searchQuery.toLowerCase()
            if (grupo.grupo.toLowerCase().includes(q)) return true
            return grupo.cargos.some(c => c.cargo.toLowerCase().includes(q))
          })

          // Falha ao carregar e carregando sao estados diferentes, e a pessoa
          // precisa saber em qual esta: um pede para tentar de novo, o outro
          // pede para esperar.
          if (falhouCatalogo) {
            return (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-amber-500/20 rounded-xl bg-amber-500/5">
                <X className="w-8 h-8 text-amber-700 mb-3" />
                <p className="text-sm font-medium text-[#3f3732]">Não conseguimos carregar as vagas.</p>
                <p className="text-xs text-[#6f5c4e] mt-1">
                  Atualize a página e tente de novo. Se continuar, escreva para a gente.
                </p>
              </div>
            )
          }

          if (!catalogo) {
            return (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-[#f4efe8] animate-pulse" />
                ))}
              </div>
            )
          }

          if (filteredGroups.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-[#e7e1da] rounded-xl bg-[#faf9f6]">
                <Search className="w-8 h-8 text-[#6f5c4e] mb-3" />
                <p className="text-sm font-medium text-[#3f3732]">Nenhum cargo encontrado.</p>
                <p className="text-xs text-[#6f5c4e] mt-1">Tente pesquisar usando outros termos ou jargões.</p>
              </div>
            )
          }

          return filteredGroups.map(grupo => {
          const forceExpand = searchQuery.trim().length > 0
          const isExpanded = forceExpand || expandedGrupos.has(grupo.slug)
          const selectedInGroup = grupo.cargos.filter(c => selected.includes(c.cargo)).length
          
          const filteredCargos = forceExpand
            ? grupo.cargos.filter(c => c.cargo.toLowerCase().includes(searchQuery.toLowerCase()) || grupo.grupo.toLowerCase().includes(searchQuery.toLowerCase()))
            : grupo.cargos

          return (
            <div key={grupo.slug} className="rounded-xl border border-[#e7e1da] overflow-hidden">
              <button
                id={`accordion-btn-${grupo.slug}`}
                aria-expanded={isExpanded}
                aria-controls={`accordion-panel-${grupo.slug}`}
                onClick={() => !forceExpand && toggleGrupo(grupo.slug)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f4efe8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#1a1a1a]">{grupo.grupo}</span>
                  <span className="text-xs text-[#6f5c4e]">
                    {grupo.cargos.length} {grupo.cargos.length === 1 ? 'cargo' : 'cargos'}
                  </span>
                  {selectedInGroup > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#7a1520]/10 text-[#7a1520] text-xs font-bold">
                      {selectedInGroup}
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6f5c4e]" /> : <ChevronDown className="w-4 h-4 text-[#6f5c4e]" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    id={`accordion-panel-${grupo.slug}`}
                    role="region"
                    aria-labelledby={`accordion-btn-${grupo.slug}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}>
                    <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border-t border-[#e7e1da] pt-2">
                      {filteredCargos.map(item => {
                        const cargo = item.cargo
                        const isSelected = selected.includes(cargo)
                        const isRecommended = recommended.includes(cargo)
                        const isDisabled = !isSelected && selected.length >= MAX_CARGOS
                        return (
                            <button
                              key={cargo}
                              onClick={() => !isDisabled && toggleCargo(cargo)}
                              disabled={isDisabled}
                              aria-pressed={isSelected}
                              className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08]
                                ${isSelected
                                  ? 'bg-[#7a1520]/10 border border-[#7a1520]/40 text-[#7a1520]'
                                  : isDisabled
                                    ? 'opacity-30 cursor-not-allowed text-[#6f5c4e] border border-transparent'
                                    : isRecommended
                                      ? 'border border-[#dcc8b1] bg-[#f1ebe3] text-[#7a1520] hover:border-[#c9ab94] hover:bg-[#ebe2d7]'
                                      : 'border border-[#e7e1da] text-[#3f3732] hover:border-[#c9ab94] hover:bg-[#f4efe8] hover:text-[#7a1520]'
                                }`}>
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                              <span className="min-w-0">{cargo}</span>
                              <span className="flex flex-wrap items-center gap-1.5">
                                {/*
                                  Vaga aberta agora, vinda do Controle de Vagas.
                                  E a informacao mais acionavel da lista: diz
                                  onde a candidatura tem chance hoje.
                                */}
                                {item.vagaAberta && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#7a1520]/10 text-[#7a1520] text-xs font-semibold">
                                    Vaga aberta
                                  </span>
                                )}
                                {isRecommended && !isSelected && <Sparkles className="w-3.5 h-3.5 text-[#7a1520] opacity-80" />}
                                {/*
                                  Span com role de botao, e nao <button>: este
                                  cartao inteiro ja e um <button>, e botao
                                  dentro de botao e HTML invalido — o navegador
                                  desfaz o aninhamento e a selecao para de
                                  funcionar.
                                */}
                                {item.descritivo && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Ver descricao do cargo ${cargo}`}
                                    onClick={(e) => { e.stopPropagation(); setVendoDescritivo(item.descritivo!) }}
                                    onKeyDown={(e) => {
                                      if (e.key !== 'Enter' && e.key !== ' ') return
                                      e.preventDefault(); e.stopPropagation()
                                      setVendoDescritivo(item.descritivo!)
                                    }}
                                    className="px-1.5 py-0.5 rounded text-xs font-medium text-[#6f5c4e] border border-[#e2d6cb] hover:text-[#7a1520] hover:border-[#c9ab94] hover:bg-[#f4efe8] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08]"
                                  >
                                    detalhes
                                  </span>
                                )}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })
        })()}
      </div>

      {vendoDescritivo && (
        <DescritivoCargo
          descritivo={vendoDescritivo}
          selecionado={selected.includes(vendoDescritivo.cargo)}
          podeSelecionar={selected.length < MAX_CARGOS}
          aoSelecionar={() => toggleCargo(vendoDescritivo.cargo)}
          aoFechar={() => setVendoDescritivo(null)}
        />
      )}
    </div>
  )
}

// ─── File Drop (Step 3 -> 1) ───────────────────────────────────────────────────
function FileDropZone({ file, onFile }: {
  file: File | null
  onFile: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onFile(f)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleChange} />
      {file ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#7a1520]/30 bg-[#7a1520]/[0.05]">
          <FileText className="w-8 h-8 text-[#7a1520] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#1a1a1a] truncate">{file.name}</div>
            <div className="text-xs text-[#6f5c4e] mt-0.5">{formatSize(file.size)} · PDF</div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Trocar arquivo de currículo"
            className="text-xs text-[#7a1520] hover:text-[#941d2b] transition-colors focus-visible:outline-none focus-visible:underline">
            Trocar arquivo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          aria-label="Selecionar arquivo PDF do currículo. Arraste ou clique para escolher."
          className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08]
            ${dragging ? 'border-[#7a1520] bg-[#f1ebe3] scale-[1.02]' : 'border-[#d9cdbf] hover:border-[#c9ab94] hover:bg-[#faf9f6]'}`}>
          <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${dragging ? 'text-[#7a1520] animate-bounce' : 'text-[#6f5c4e]'}`} />
          <div className="text-sm font-medium text-[#1a1a1a] mb-1">Arraste o PDF do currículo aqui</div>
          <div className="text-xs text-[#6f5c4e]">ou clique para selecionar · máx. {CV_MAX_TEXTO}</div>
        </button>
      )}
    </div>
  )
}

// ─── Input Component ──────────────────────────────────────────────────────────
function Field({ label, id, children, error }: {
  label: string
  id: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[#6f5c4e] mb-1.5">{label}</label>
      {children}
      {error && (
        <p role="alert" aria-live="polite" className="mt-1 text-xs text-[#b42318]">{error}</p>
      )}
    </div>
  )
}

const inputCls = "w-full bg-white border border-[#d9cdbf] rounded-[6px] px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#9a8c80] focus:outline-none focus:border-[#7a1520] focus:ring-2 focus:ring-[#7a1520]/10 transition-all"

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CandidatarPage() {
  const [step, setStep] = useState(1)
  const [lgpdAberto, setLgpdAberto] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [recommended, setRecommended] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')
  const { track } = useAnalytics()

  const [form, setForm] = useState<FormData>({
    nome:        '',
    email:       '',
    telefone:    '',
    cidade:      '',
    estado:      '',
    cargosInteresse: [],
    cvFile:      null,
    mensagem:    '',
    consentimentoLgpd: false,
    tiposVaga:   [],
    genero:         '',
    dataNascimento: '',
    escolaridade:   '',
  })

  // ── Draft Recovery — restaura rascunho anônimo na carga inicial ──
  useEffect(() => {
    const draft = loadDraft('')
    if (draft) {
      setForm(prev => ({ ...prev, ...draft, cvFile: prev.cvFile }))
      track('draft_restored', { cargosCount: draft.cargosInteresse?.length ?? 0 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Quando o e-mail é preenchido, migra o rascunho anônimo para chave com e-mail ──
  useEffect(() => {
    if (!form.email) return
    migrateDraft(form.email)
  }, [form.email])

  // ── Auto-save a cada alteração no formulário ──
  useEffect(() => {
    const { cvFile, ...rest } = form
    if (rest.nome || rest.email || rest.telefone || rest.cargosInteresse.length > 0) {
      saveDraft(rest.email, rest)
      track('draft_saved', { step, hasName: !!rest.nome, cargosCount: rest.cargosInteresse.length })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  const set = (key: keyof FormData, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }

  const toggleTipoVaga = (tipo: 'pcd' | 'mulheres') => {
    const current = form.tiposVaga
    set('tiposVaga', current.includes(tipo) ? current.filter(t => t !== tipo) : [...current, tipo])
  }

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '')
    let formatted = raw
    if (raw.length > 2) formatted = `(${raw.substring(0,2)}) ${raw.substring(2)}`
    if (raw.length > 7) formatted = `(${raw.substring(0,2)}) ${raw.substring(2,7)}-${raw.substring(7,11)}`
    set('telefone', formatted)
  }

  // AI Parser Helper
  const handleFileUpload = async (f: File) => {
    // Recusa na hora, e não só no envio final (antes o servidor barrava em 2 MB no último passo)
    if (f.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, cvFile: 'Envie o currículo em PDF.' }))
      return
    }
    if (f.size > CV_MAX_BYTES) {
      setErrors(prev => ({ ...prev, cvFile: `O arquivo tem ${(f.size / (1024 * 1024)).toFixed(1)} MB. O máximo é ${CV_MAX_TEXTO}.` }))
      return
    }
    set('cvFile', f)
    setParsing(true)
    try {
      const fd = new FormData()
      fd.append("file", f)
      const res = await fetch('/api/carreiras/parse-cv', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        if (data.name) set('nome', data.name)
        if (data.email) set('email', data.email)
        if (data.phone) handlePhoneChange(data.phone)
        if (data.estado) set('estado', data.estado)
        if (data.cargosRec && data.cargosRec.length > 0) {
          setRecommended(data.cargosRec)
        }
      }
    } catch(e) {
      console.error("Falha ao usar AI parsing:", e)
    } finally {
      // Delay pequeno para o design respirar antes de trocar de tela automaticamente
      setTimeout(() => {
        setParsing(false)
        setStep(2)
      }, 500)
    }
  }

  // ── Validação por passo ──
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 1) {
      if (!form.cvFile) errs.cvFile = 'Envie seu currículo em PDF'
      if (!form.consentimentoLgpd) errs.consentimentoLgpd = 'Você precisa aceitar os termos de privacidade'
    }
    if (s === 2) {
      if (!form.nome.trim() || form.nome.trim().length < 2) errs.nome = 'Nome obrigatório (mínimo 2 caracteres)'
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'E-mail inválido'
      if (!form.cidade.trim()) errs.cidade = 'Cidade obrigatória'
      if (!form.estado) errs.estado = 'Estado obrigatório'
      const nascimento = lerDataNascimento(form.dataNascimento)
      if (!nascimento) errs.dataNascimento = 'Informe sua data de nascimento'
      else if (!idadeAceita(nascimento)) errs.dataNascimento = `Idade deve estar entre ${IDADE_MINIMA} e ${IDADE_MAXIMA} anos`
      if (!form.genero) errs.genero = 'Escolha uma opção'
      if (!form.escolaridade) errs.escolaridade = 'Informe sua escolaridade'
    }
    if (s === 3) {
      if (form.cargosInteresse.length === 0) errs.cargosInteresse = 'Selecione pelo menos 1 cargo'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      track('step_advanced', { from: step, to: step + 1 })
      setStep(s => s + 1)
    }
  }

  // ── Upload do CV na Nuvem p/ Banco ──
  const uploadCv = async (file: File): Promise<{ url: string; publicId: string; originalFilename: string; sizeBytes: number; mimeType: string; cvHash: string } | null> => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/carreiras/upload-cv', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        const errorMsg = data.error ?? 'Erro ao enviar arquivo'
        setErrors(prev => ({ ...prev, cvFile: errorMsg }))
        setGlobalError(errorMsg)
        return null
      }
      const data = await res.json()
      return {
        url:              data.url,
        publicId:         data.publicId,
        originalFilename: data.originalFilename,
        sizeBytes:        data.sizeBytes,
        mimeType:         data.mimeType,
        cvHash:           data.cvHash,
      }
    } catch {
      const errorMsg = 'Falha ao enviar arquivo. Tente novamente.'
      setErrors(prev => ({ ...prev, cvFile: errorMsg }))
      setGlobalError(errorMsg)
      return null
    } finally {
      setUploading(false)
    }
  }

  // ── Submit final ──
  const handleSubmit = async () => {
    if (!validateStep(3)) return
    setGlobalError('')

    // Upload do CV para o armazenamento privado (Vercel Blob)
    if (!form.cvFile) {
      setGlobalError('Currículo não encontrado. Volte ao passo 1 e envie o PDF novamente.')
      return
    }
    const uploaded = await uploadCv(form.cvFile)
    if (!uploaded) return // erro já setado dentro de uploadCv

    setSubmitting(true)
    try {
      const prefixos = form.tiposVaga.map(t => t === 'pcd' ? '[Vaga Exclusiva PCD]' : '[Vaga Exclusiva Mulheres]')
      const mensagemFinal = [...prefixos, form.mensagem.trim()].filter(Boolean).join(' ') || undefined

      const res = await fetch('/api/carreiras/candidaturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:               form.nome.trim(),
          email:              form.email.trim().toLowerCase(),
          telefone:           form.telefone.trim() || undefined,
          cidade:             form.cidade.trim(),
          estado:             form.estado,
          cargosInteresse:    form.cargosInteresse,
          cvUrl:              uploaded.url,
          cvPublicId:         uploaded.publicId,
          cvOriginalFilename: uploaded.originalFilename,
          cvMimeType:         uploaded.mimeType,
          cvSizeBytes:        uploaded.sizeBytes,
          cvHash:             uploaded.cvHash,
          mensagem:           mensagemFinal,
          genero:             form.genero || undefined,
          dataNascimento:     form.dataNascimento || undefined,
          escolaridade:       form.escolaridade || undefined,
          consentimentoLgpd:  true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setGlobalError('Você já se candidatou para um ou mais desses cargos nos últimos 30 dias.')
        } else if (res.status === 429) {
          setGlobalError('Muitas tentativas. Aguarde 24h para enviar outra candidatura.')
        } else {
          setGlobalError(data.error ?? 'Erro ao enviar candidatura. Tente novamente.')
        }
        return
      }

      // Limpa o rascunho após candidatura enviada com sucesso
      clearDraft(form.email)

      track('candidatura_submitted', {
        cargosCount: form.cargosInteresse.length,
        hasMessage:  !!form.mensagem.trim(),
        estado:      form.estado,
      })

      setStep(4)
    } catch {
      setGlobalError('Falha de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`tema-claro min-h-screen flex flex-col bg-[#faf9f6] text-[#1a1a1a] ${montserrat.variable}`}
      style={{ fontFamily: 'var(--font-hub), Arial, sans-serif' }}
    >
      {/* Mesmo cabeçalho e rodapé do hub; o wrapper .hub traz as cores e o sticky. */}
      <div className={hubStyles.hub} style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <HubNav />
      </div>

      <main id="conteudo" className="relative flex-1">
        <div className="max-w-xl mx-auto px-4 py-10">

          {/* Step 4 — Sucesso */}
          {step === 4 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onAnimationComplete={() => {
                // Efeito Confetti WoW ao finalizar 🎉
                const duration = 2000;
                const end = Date.now() + duration;
                
                (function frame() {
                  confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#7a1520', '#dcc8b1', '#bb8c08', '#c98d90']
                  });
                  confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#7a1520', '#dcc8b1', '#bb8c08', '#c98d90']
                  });
              
                  if (Date.now() < end) {
                    requestAnimationFrame(frame);
                  }
                }());
              }}
              className="text-center py-16">
              {/* Glow extra atrás do ícone de sucesso */}
              <div className="relative inline-flex mb-6">
                <div className="absolute inset-0 rounded-full bg-[#7a1520]/10 blur-2xl scale-150" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="relative w-20 h-20 rounded-full bg-[#7a1520]/[0.06] border-2 border-[#7a1520]/40 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="w-10 h-10 text-[#7a1520]" />
                </motion.div>
              </div>
              <h2 className="text-[28px] font-semibold tracking-[-0.04em] text-[#1a1a1a] mb-3">Candidatura Concluída!</h2>
              <p className="text-[#6f5c4e] text-sm leading-relaxed max-w-sm mx-auto mb-8">
                Parabéns! Sucesso no seu primeiro passo no Banco de Talentos do Grupo Pau Brasil.
                Nossa equipe de Gente & Gestão analisará seu perfil.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/carreiras"
                  className="px-5 py-3 rounded-[3px] bg-white border border-[#dcc8b1] text-[#7a1520] text-sm font-semibold hover:bg-[#f4efe8] transition-colors">
                  ← Voltar para Carreiras
                </Link>
                <Link href="/"
                  className="px-5 py-3 rounded-[3px] bg-[#7a1520] text-white hover:bg-[#941d2b] text-sm font-semibold transition-colors">
                  Ir para a Página Inicial
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header form */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#1a1a1a]">
                  {step === 1 && 'Envie seu currículo'}
                  {step === 2 && 'Confirme seus dados'}
                  {step === 3 && 'Onde quer atuar?'}
                </h1>
                <p className="text-[#6f5c4e] text-sm mt-1.5 flex items-center justify-center gap-1.5">
                  {step === 1 && `Vamos começar pelo seu CV em PDF (máx. ${CV_MAX_TEXTO})`}
                  {step === 2 && <><Sparkles className="w-3.5 h-3.5 text-[#7a1520]" /> Auto-preenchidos pela IA. Revise os campos abaixo.</>}
                  {step === 3 && `Escolha até ${MAX_CARGOS} cargos de interesse`}
                </p>
              </motion.div>

              <ProgressBar step={step} />

              {/* Card de vidro envolvendo o conteúdo do passo */}
              <div className="rounded-[10px] bg-white border border-[#e7e1da] p-6 relative overflow-hidden shadow-[0_18px_40px_-28px_rgba(74,29,20,0.35)]">

              {parsing && (
                <div className="absolute inset-x-0 top-0 h-1 bg-[#7a1520]/10 overflow-hidden z-20">
                    <motion.div 
                        initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="w-1/3 h-full bg-[#7a1520]" />
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}>

                  {/* ── Passo 1 ── (Antes era Step 3) */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <Field id="campo-cv" label="Currículo (PDF) *" error={errors.cvFile}>
                        {parsing ? (
                          <div className="rounded-xl border-2 border-[#dcc8b1] border-dashed p-8 text-center bg-[#faf9f6] flex flex-col items-center justify-center h-[200px] transition-all">
                            <Loader2 className="w-8 h-8 text-[#7a1520] animate-spin mb-4" />
                            <div className="text-sm font-semibold text-[#7a1520]">Lendo as entrelinhas do seu currículo...</div>
                            <div className="text-xs text-[#6f5c4e] mt-1.5 animate-pulse">Extraindo dados para preencher o formulário pra você</div>
                          </div>
                        ) : (
                          <FileDropZone
                            file={form.cvFile}
                            onFile={handleFileUpload}
                          />
                        )}
                      </Field>

                      <div className="rounded-xl border border-[#e7e1da] bg-[#faf9f6] p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <div className="relative shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={form.consentimentoLgpd}
                              onChange={e => set('consentimentoLgpd', e.target.checked)}
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                              ${form.consentimentoLgpd ? 'bg-[#7a1520] border-[#7a1520]' : 'border-[#b9a593] bg-white'}`}>
                              {form.consentimentoLgpd && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <span className="text-xs text-[#6f5c4e] leading-relaxed">
                            Concordo que o Grupo Pau Brasil armazene e utilize meus dados para fins de recrutamento e seleção, 
                            conforme a LGPD.
                          </span>
                        </label>
                        {/*
                          Fora do <label> de proposito: dentro dele, o clique
                          marcaria o "Concordo" junto com abrir o texto.
                        */}
                        <button
                          type="button"
                          onClick={() => setLgpdAberto(true)}
                          className="mt-2 ml-7 text-xs text-[#7a1520] hover:text-[#941d2b] underline underline-offset-2 transition-colors"
                        >
                          Consulte a LGPD
                        </button>
                        {errors.consentimentoLgpd && (
                          <p className="mt-2 text-xs text-[#b42318] pl-7">{errors.consentimentoLgpd}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Passo 2 ── (Antes era Step 1) */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {/* Inline Validation Visuals */}
                      <Field id="campo-nome" label="Nome completo *" error={errors.nome}>
                        <div className="relative">
                            <input id="campo-nome" className={inputCls + (form.nome.length >= 2 ? ' border-[#7a1520]/40 focus:border-[#7a1520] pr-10' : '')} placeholder="Seu nome" value={form.nome}
                                onChange={e => set('nome', e.target.value)} />
                            {form.nome.length >= 2 && <CheckCircle2 className="w-4 h-4 text-[#7a1520] absolute right-3 top-3.5" />}
                        </div>
                      </Field>
                      <Field id="campo-email" label="E-mail *" error={errors.email}>
                        <div className="relative">
                            <input id="campo-email" className={inputCls + (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? ' border-[#7a1520]/40 focus:border-[#7a1520] pr-10' : '')} type="email" placeholder="seu@email.com" value={form.email}
                                onChange={e => set('email', e.target.value)} />
                            {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && <CheckCircle2 className="w-4 h-4 text-[#7a1520] absolute right-3 top-3.5" />}
                        </div>
                      </Field>
                      <Field id="campo-telefone" label="Telefone / WhatsApp">
                        <div className="relative">
                            <input id="campo-telefone" className={inputCls + (form.telefone.length >= 14 ? ' border-[#7a1520]/40 focus:border-[#7a1520] pr-10' : '')} placeholder="(83) 99999-9999" value={form.telefone}
                                onChange={e => handlePhoneChange(e.target.value)} />
                            {form.telefone.length >= 14 && <CheckCircle2 className="w-4 h-4 text-[#7a1520] absolute right-3 top-3.5" />}
                        </div>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field id="campo-cidade" label="Cidade *" error={errors.cidade}>
                          <div className="relative">
                              <input id="campo-cidade" className={inputCls + (form.cidade.length > 2 ? ' border-[#7a1520]/40 focus:border-[#7a1520] pr-10' : '')} placeholder="Ex: Patos" value={form.cidade}
                                onChange={e => set('cidade', e.target.value)} />
                              {form.cidade.length > 2 && <CheckCircle2 className="w-4 h-4 text-[#7a1520] absolute right-3 top-3.5" />}
                          </div>
                        </Field>
                        <Field id="campo-estado" label="Estado *" error={errors.estado}>
                          <select id="campo-estado" className={inputCls + (form.estado ? ' border-[#7a1520]/40 focus:border-[#7a1520]' : '')} value={form.estado}
                            onChange={e => set('estado', e.target.value)}>
                            <option value="">UF</option>
                            {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                          </select>
                        </Field>
                      </div>

                      {/*
                        Perfil de triagem. A IA nao preenche estes campos — o
                        curriculo raramente traz genero ou nascimento, e um
                        palpite errado aqui seria pior que perguntar.
                      */}
                      <div className="pt-4 border-t border-[#e7e1da] space-y-4">
                        <p className="text-xs text-[#6f5c4e] leading-relaxed">
                          Estes dados ajudam a equipe de Gente &amp; Gestão na triagem. Só o RH tem acesso a eles.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Field id="campo-nascimento" label="Data de nascimento *" error={errors.dataNascimento}>
                            <input
                              id="campo-nascimento"
                              type="date"
                              // Sem `max`, o seletor do iPhone abre no ano atual
                              // e a pessoa rola decadas; com ele, abre perto.
                              max={new Date().toISOString().slice(0, 10)}
                              className={inputCls + ' min-h-[42px] appearance-none' + (form.dataNascimento ? ' border-[#7a1520]/40' : '')}
                              value={form.dataNascimento}
                              onChange={e => set('dataNascimento', e.target.value)}
                            />
                          </Field>
                          <Field id="campo-genero" label="Gênero *" error={errors.genero}>
                            <select id="campo-genero" className={inputCls + (form.genero ? ' border-[#7a1520]/40' : '')} value={form.genero}
                              onChange={e => set('genero', e.target.value)}>
                              <option value="">Selecione</option>
                              {GENEROS.map(g => <option key={g.valor} value={g.valor}>{g.rotulo}</option>)}
                            </select>
                          </Field>
                        </div>
                        <Field id="campo-escolaridade" label="Escolaridade *" error={errors.escolaridade}>
                          <select id="campo-escolaridade" className={inputCls + (form.escolaridade ? ' border-[#7a1520]/40' : '')} value={form.escolaridade}
                            onChange={e => set('escolaridade', e.target.value)}>
                            <option value="">Selecione</option>
                            {ESCOLARIDADES.map(e => <option key={e.valor} value={e.valor}>{e.rotulo}</option>)}
                          </select>
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* ── Passo 3 ── (Antes era Step 2 + Mensagem) */}
                  {step === 3 && (
                    <div className="space-y-6">

                      {/* Vagas exclusivas PCD / Mulheres */}
                      <div className="rounded-xl border border-[#e7e1da] bg-[#faf9f6] p-4 space-y-2.5">
                        <p className="text-xs font-medium text-[#6f5c4e]">Candidatura para vaga exclusiva <span className="text-[#6f5c4e]">(opcional)</span></p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleTipoVaga('pcd')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                              form.tiposVaga.includes('pcd')
                                ? 'bg-[#7a1520]/10 border-[#dcc8b1] text-[#7a1520]'
                                : 'border-[#e2d6cb] text-[#6f5c4e] hover:border-[#c9ab94] hover:text-[#3f3732]'
                            }`}>
                            {form.tiposVaga.includes('pcd') && <Check className="w-3 h-3" />}
                            Vaga exclusiva PCD
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTipoVaga('mulheres')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                              form.tiposVaga.includes('mulheres')
                                ? 'bg-[#7a1520]/10 border-[#7a1520]/40 text-[#7a1520]'
                                : 'border-[#e2d6cb] text-[#6f5c4e] hover:border-[#c9ab94] hover:text-[#3f3732]'
                            }`}>
                            {form.tiposVaga.includes('mulheres') && <Check className="w-3 h-3" />}
                            Vaga exclusiva Mulheres
                          </button>
                        </div>
                      </div>

                      {recommended.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-[#f1ebe3] border border-[#dcc8b1] rounded-xl p-3.5 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-[#7a1520] shrink-0 mt-0.5" />
                            <div>
                                <div className="text-[13px] font-semibold text-[#7a1520]">Sugestões para você</div>
                                <div className="text-xs text-[#6f5c4e] mt-1 leading-relaxed">A Inteligência Artificial mapeou {recommended.length} área(s) que dão o *match* perfeito com suas competências no currículo.</div>
                            </div>
                        </motion.div>
                      )}

                      <div>
                          {errors.cargosInteresse && (
                            <p className="mb-3 text-xs text-[#b42318]">{errors.cargosInteresse}</p>
                          )}
                          <CargoSelector
                            selected={form.cargosInteresse}
                            recommended={recommended}
                            onChange={cargos => set('cargosInteresse', cargos)}
                          />
                      </div>

                      <Field id="campo-mensagem" label="Mensagem (opcional)">
                        <div className="relative">
                          <textarea
                            id="campo-mensagem"
                            className={inputCls + ' resize-none'}
                            rows={3}
                            placeholder="Apresente-se brevemente, conte sobre sua experiência..."
                            maxLength={1000}
                            value={form.mensagem}
                            onChange={e => set('mensagem', e.target.value)} />
                          <span className="absolute bottom-2 right-3 text-xs text-[#6f5c4e]">
                            {form.mensagem.length}/1000
                          </span>
                        </div>
                      </Field>

                      {globalError && (
                        <div className="rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 text-xs text-[#b42318]">
                          {globalError}
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#e7e1da] relative z-10">

                {step > 1 ? (
                  <button onClick={() => setStep(s => s - 1)} disabled={parsing}
                    className="flex items-center gap-2 text-sm text-[#6f5c4e] hover:text-[#7a1520] transition-colors disabled:opacity-50">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                ) : (
                  <Link href="/carreiras" className="flex items-center gap-2 text-sm text-[#6f5c4e] hover:text-[#7a1520] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Carreiras
                  </Link>
                )}

                {step < 3 ? (
                  <button onClick={nextStep} disabled={parsing}
                    className="flex items-center gap-2 px-6 py-3 rounded-[3px] bg-[#7a1520] text-white text-sm font-semibold hover:bg-[#941d2b] transition-colors disabled:opacity-50">
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={uploading || submitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-[3px] bg-[#7a1520] text-white hover:bg-[#941d2b] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {uploading ? 'Finalizando...' : submitting ? 'Registrando...' : 'Finalizar Submissão'}
                    {!uploading && !submitting && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
              </div> {/* fim glass card */}
            </>
          )}
          {/* E-mail alternativo */}
          <div className="text-center mt-5">
            <p className="text-xs text-[#6f5c4e] mb-1">Prefere enviar por e-mail?</p>
            <EmailsCurriculo className="text-xs" />
          </div>
        </div>
      </main>
      <div className={hubStyles.hub}>
        <HubFooter />
      </div>
      {lgpdAberto && <AvisoLgpd aoFechar={() => setLgpdAberto(false)} />}
    </div>
  )
}
