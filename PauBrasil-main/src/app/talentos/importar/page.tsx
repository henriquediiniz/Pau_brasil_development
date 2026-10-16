'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Upload, X, CheckCircle2, AlertCircle, Loader2, ChevronLeft, Save, FileText, ChevronDown } from 'lucide-react'
import { CARREIRAS_GRUPOS } from '@/lib/carreiras-areas'

// ─── Types ────────────────────────────────────────────────────────────────────
type FileStatus = 'queued' | 'processing' | 'done' | 'error'

interface ImportItem {
  id:          string
  filename:    string
  status:      FileStatus
  errorMsg?:   string
  // CV storage
  cvUrl?:             string
  cvPublicId?:        string
  cvHash?:            string
  cvOriginalFilename?: string
  cvSizeBytes?:       number
  // Editable fields
  nome:        string
  email:       string
  telefone:    string
  cidade:      string
  estado:      string
  cargosInteresse: string[]
}

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
                    'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const MAX_CARGOS = 3
type Step = 'select' | 'processing' | 'review' | 'saving' | 'done'

// ─── Cargo Popover ────────────────────────────────────────────────────────────
function CargoPopover({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const toggle = (cargo: string) => {
    if (value.includes(cargo)) onChange(value.filter(c => c !== cargo))
    else if (value.length < MAX_CARGOS) onChange([...value, cargo])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/12 text-xs text-slate-300 hover:bg-white/8 transition-colors min-w-[110px]"
      >
        <span className="flex-1 text-left truncate">
          {value.length === 0 ? 'Selecionar' : `${value.length} cargo${value.length > 1 ? 's' : ''}`}
        </span>
        <ChevronDown className="w-3 h-3 shrink-0 text-slate-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-72 overflow-y-auto rounded-xl bg-[#1a1a2e] border border-white/12 shadow-2xl p-2">
          {value.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-white/8">
              {value.map(c => (
                <span key={c} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-brand-500/15 text-brand-400 border border-brand-500/20">
                  {c}
                  <button type="button" onClick={() => toggle(c)} className="hover:text-red-400"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          )}
          {value.length >= MAX_CARGOS && (
            <p className="text-[10px] text-slate-500 text-center mb-2">Máximo {MAX_CARGOS} cargos</p>
          )}
          {CARREIRAS_GRUPOS.map(g => (
            <div key={g.slug} className="mb-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold px-1 mb-1">{g.grupo}</div>
              {g.cargos.map(cargo => {
                const checked = value.includes(cargo)
                const disabled = !checked && value.length >= MAX_CARGOS
                return (
                  <button
                    key={cargo}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(cargo)}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors
                      ${checked ? 'bg-brand-500/15 text-brand-400' : disabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    {checked && <span className="mr-1">✓</span>}{cargo}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Status Icon ──────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: FileStatus }) {
  if (status === 'queued')     return <div className="w-4 h-4 rounded-full border-2 border-white/20" />
  if (status === 'processing') return <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
  if (status === 'done')       return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  return <AlertCircle className="w-4 h-4 text-red-400" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ImportarPage() {
  const [step,    setStep]   = useState<Step>('select')
  const [items,   setItems]  = useState<ImportItem[]>([])
  const [result,  setResult] = useState<{ created: number; skipped: number; errors: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const update = useCallback((id: string, patch: Partial<ImportItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  }, [])

  const addFiles = (files: FileList | File[]) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (pdfs.length === 0) return
    const newItems: ImportItem[] = pdfs.map(f => ({
      id:             crypto.randomUUID(),
      filename:       f.name,
      status:         'queued',
      nome:           '',
      email:          '',
      telefone:       '',
      cidade:         '',
      estado:         '',
      cargosInteresse: [],
      _file:          f,
    } as ImportItem & { _file: File }))
    setItems(prev => [...prev, ...newItems])
  }

  const processAll = async () => {
    if (items.length === 0) return
    setStep('processing')
    const toProcess = [...items]

    for (const item of toProcess) {
      update(item.id, { status: 'processing' })
      try {
        const fd = new FormData()
        // Retrieve the original File object from the DOM input (we store it separately)
        const fileInput = document.getElementById(`file-${item.id}`) as HTMLInputElement | null
        const rawFile = fileInput?.files?.[0]

        // We stored _file on the object directly during addFiles
        const anyItem = item as ImportItem & { _file?: File }
        const file = anyItem._file ?? rawFile
        if (!file) { update(item.id, { status: 'error', errorMsg: 'Arquivo não encontrado' }); continue }

        fd.append('file', file)
        const res = await fetch('/api/admin/rh/importar-cv', { method: 'POST', body: fd })
        const data = await res.json()

        if (!res.ok) {
          update(item.id, { status: 'error', errorMsg: data.error ?? 'Erro ao processar' })
        } else {
          update(item.id, {
            status:             'done',
            cvUrl:              data.cvUrl,
            cvPublicId:         data.cvPublicId,
            cvHash:             data.cvHash,
            cvOriginalFilename: data.cvOriginalFilename,
            cvSizeBytes:        data.cvSizeBytes,
            nome:               data.nome     || '',
            email:              data.email    || '',
            telefone:           data.telefone || '',
            cidade:             data.cidade   || '',
            estado:             data.estado   || '',
            cargosInteresse:    data.cargosRec ?? [],
          })
        }
      } catch {
        update(item.id, { status: 'error', errorMsg: 'Falha de conexão' })
      }
    }
    setStep('review')
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id))

  const save = async () => {
    const readyItems = items.filter(it => it.status === 'done' && it.nome.trim())
    if (readyItems.length === 0) return
    setStep('saving')

    const payload = readyItems.map(it => ({
      nome:              it.nome.trim(),
      email:             it.email.trim(),
      telefone:          it.telefone.trim() || undefined,
      cidade:            it.cidade.trim(),
      estado:            it.estado,
      cargosInteresse:   it.cargosInteresse,
      cvUrl:             it.cvUrl!,
      cvPublicId:        it.cvPublicId!,
      cvOriginalFilename: it.cvOriginalFilename,
      cvSizeBytes:       it.cvSizeBytes,
      cvMimeType:        'application/pdf',
      cvHash:            it.cvHash!,
    }))

    try {
      const res  = await fetch('/api/admin/rh/candidaturas/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setResult({ created: data.created, skipped: data.skipped, errors: data.errors?.length ?? 0 })
      setStep('done')
    } catch {
      setStep('review')
      alert('Falha ao salvar. Tente novamente.')
    }
  }

  const reset = () => { setItems([]); setResult(null); setStep('select') }

  const doneCount    = items.filter(it => it.status === 'done').length
  const errorCount   = items.filter(it => it.status === 'error').length
  const readyToSave  = items.filter(it => it.status === 'done' && it.nome.trim()).length
  const processed    = items.filter(it => it.status !== 'queued' && it.status !== 'processing').length

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/talentos" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center">
          <Upload className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-lg font-display font-bold text-white">Importar Currículos</h1>
          <p className="text-[11px] text-slate-500">Apenas PDFs digitais (não escaneados)</p>
        </div>
      </div>

      {/* ── STEP: SELECT ─────────────────────────────────────────────────────── */}
      {step === 'select' && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
            className={`glass-card rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all
              ${dragging ? 'border-brand-500/60 bg-brand-500/5' : 'border-white/8 hover:border-white/15 hover:bg-white/3'}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
              ${dragging ? 'bg-brand-500/20' : 'bg-white/5'}`}>
              <Upload className={`w-7 h-7 ${dragging ? 'text-brand-400' : 'text-slate-500'}`} />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Arraste os PDFs aqui</p>
              <p className="text-slate-500 text-sm mt-1">ou clique para selecionar arquivos</p>
              <p className="text-slate-600 text-xs mt-1">Máx. 10 MB por arquivo · Apenas PDFs digitais</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* Lista de arquivos selecionados */}
          {items.length > 0 && (
            <div className="glass-card rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">{items.length} arquivo{items.length > 1 ? 's' : ''} selecionado{items.length > 1 ? 's' : ''}</span>
                <button onClick={() => setItems([])} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Limpar tudo</button>
              </div>
              {items.map(it => (
                <div key={it.id} className="flex items-center gap-3 py-1.5">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-300 flex-1 truncate">{it.filename}</span>
                  <button onClick={() => removeItem(it.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={processAll}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all"
              >
                <Upload className="w-4 h-4" />
                Processar {items.length} arquivo{items.length > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP: PROCESSING ─────────────────────────────────────────────────── */}
      {step === 'processing' && (
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            <div>
              <p className="text-white font-medium text-sm">Processando arquivos...</p>
              <p className="text-slate-500 text-xs">{processed} de {items.length} concluídos</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
              style={{ width: `${items.length > 0 ? (processed / items.length) * 100 : 0}%` }}
            />
          </div>
          {items.map(it => (
            <div key={it.id} className="flex items-center gap-3 py-1">
              <StatusIcon status={it.status} />
              <span className="text-xs text-slate-300 flex-1 truncate">{it.filename}</span>
              {it.errorMsg && <span className="text-[10px] text-red-400 truncate max-w-[200px]">{it.errorMsg}</span>}
            </div>
          ))}
        </div>
      )}

      {/* ── STEP: REVIEW ─────────────────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-emerald-400 font-medium">{doneCount} prontos</span>
              {errorCount > 0 && <span className="text-red-400 font-medium">{errorCount} com erro</span>}
              <span className="text-slate-500">Revise e corrija antes de salvar</span>
            </div>
            <button
              onClick={save}
              disabled={readyToSave === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:transform-none disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Salvar {readyToSave} candidatura{readyToSave !== 1 ? 's' : ''}
            </button>
          </div>

          {/* Erros */}
          {errorCount > 0 && (
            <div className="glass-card rounded-2xl p-4 border border-red-500/20 bg-red-500/5 space-y-2">
              <p className="text-xs font-semibold text-red-400">Arquivos com erro (não serão salvos)</p>
              {items.filter(it => it.status === 'error').map(it => (
                <div key={it.id} className="flex items-center gap-2 text-xs text-slate-400">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{it.filename}</span>
                  <span className="text-red-400/70 shrink-0">— {it.errorMsg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Review table */}
          {doneCount > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Arquivo</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Nome *</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Telefone</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cidade</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">UF</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cargos</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.filter(it => it.status === 'done').map(it => (
                      <tr key={it.id} className={`group ${!it.nome.trim() ? 'bg-yellow-500/5' : ''}`}>
                        {/* Arquivo */}
                        <td className="px-3 py-2">
                          <span className="text-slate-500 truncate max-w-[120px] block" title={it.filename}>
                            {it.filename.replace(/\.pdf$/i, '').slice(0, 18)}{it.filename.length > 22 ? '…' : ''}
                          </span>
                        </td>
                        {/* Nome */}
                        <td className="px-3 py-2">
                          <input
                            value={it.nome}
                            onChange={e => update(it.id, { nome: e.target.value })}
                            placeholder="Nome completo *"
                            className={`w-40 bg-white/5 border rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/60 transition-colors
                              ${!it.nome.trim() ? 'border-yellow-500/40' : 'border-white/10'}`}
                          />
                        </td>
                        {/* Email */}
                        <td className="px-3 py-2">
                          <input
                            value={it.email}
                            onChange={e => update(it.id, { email: e.target.value })}
                            placeholder="email@..."
                            className="w-36 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/60 transition-colors"
                          />
                        </td>
                        {/* Telefone */}
                        <td className="px-3 py-2">
                          <input
                            value={it.telefone}
                            onChange={e => update(it.id, { telefone: e.target.value })}
                            placeholder="(83) 9..."
                            className="w-28 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/60 transition-colors"
                          />
                        </td>
                        {/* Cidade */}
                        <td className="px-3 py-2">
                          <input
                            value={it.cidade}
                            onChange={e => update(it.id, { cidade: e.target.value })}
                            placeholder="Cidade"
                            className="w-28 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/60 transition-colors"
                          />
                        </td>
                        {/* UF */}
                        <td className="px-3 py-2">
                          <select
                            value={it.estado}
                            onChange={e => update(it.id, { estado: e.target.value })}
                            className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-brand-500/60 transition-colors"
                          >
                            <option value="">UF</option>
                            {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                          </select>
                        </td>
                        {/* Cargos */}
                        <td className="px-3 py-2">
                          <CargoPopover
                            value={it.cargosInteresse}
                            onChange={v => update(it.id, { cargosInteresse: v })}
                          />
                        </td>
                        {/* Remover */}
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeItem(it.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={readyToSave === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:transform-none disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Salvar {readyToSave} candidatura{readyToSave !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: SAVING ─────────────────────────────────────────────────────── */}
      {step === 'saving' && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-white font-medium">Salvando candidaturas...</p>
        </div>
      )}

      {/* ── STEP: DONE ───────────────────────────────────────────────────────── */}
      {step === 'done' && result && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white mb-1">Importação concluída</h2>
            <div className="flex flex-wrap justify-center gap-4 mt-3 text-sm">
              <span className="text-emerald-400 font-semibold">{result.created} criadas</span>
              {result.skipped > 0 && <span className="text-slate-400">{result.skipped} duplicatas ignoradas</span>}
              {result.errors > 0 && <span className="text-red-400">{result.errors} com erro</span>}
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/talentos" className="px-5 py-2 rounded-xl bg-white/8 border border-white/12 text-white text-sm font-medium hover:bg-white/12 transition-colors">
              Ver Banco de Talentos
            </Link>
            <button onClick={reset} className="px-5 py-2 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all">
              Importar mais
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
