'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDown, ArrowUp, CheckCircle2, ChevronLeft, ImagePlus, Loader2, Save, Trash2,
} from 'lucide-react'
import { HUB_COMPANIES } from '@/lib/hub-content'

interface Foto {
  id: string
  alt: string
  width: number
  height: number
}

interface Campos {
  title: string
  dateLabel: string
  eventDate: string
  company: string
  unit: string
  summary: string
  tagline: string
  published: boolean
}

const VAZIO: Campos = {
  title: '',
  dateLabel: '',
  eventDate: new Date().toISOString().slice(0, 10),
  company: 'bebidas',
  unit: '',
  summary: '',
  tagline: '',
  published: true,
}

const LADO_MAXIMO = 1600
const campo =
  'w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40'
const rotulo = 'block text-xs font-medium text-slate-400 mb-1'

/** Reduz a foto no navegador: lado maior até 1600 px em JPEG, mais uma miniatura para o fundo desfocado. */
async function reduzirFoto(arquivo: File) {
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * escala)
  const height = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao converter a foto'))), 'image/jpeg', 0.82),
  )

  const mini = document.createElement('canvas')
  const escalaMini = 24 / Math.max(width, height)
  mini.width = Math.max(1, Math.round(width * escalaMini))
  mini.height = Math.max(1, Math.round(height * escalaMini))
  mini.getContext('2d')!.drawImage(bitmap, 0, 0, mini.width, mini.height)
  const blur = mini.toDataURL('image/jpeg', 0.6)
  bitmap.close()

  return { blob, width, height, blur }
}

export default function EditorNewsletterPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const nova = params.id === 'nova'
  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [carregando, setCarregando] = useState(!nova)
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    if (nova) return
    fetch(`/api/gente/newsletter/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((post) => {
        setCampos({
          title: post.title,
          dateLabel: post.dateLabel,
          eventDate: post.eventDate.slice(0, 10),
          company: post.company,
          unit: post.unit,
          summary: post.summary,
          tagline: post.tagline ?? '',
          published: post.published,
        })
        setFotos(post.photos)
      })
      .catch(() => setMensagem({ tipo: 'erro', texto: 'Campanha não encontrada.' }))
      .finally(() => setCarregando(false))
  }, [nova, params.id])

  const alterar = <K extends keyof Campos>(chave: K, valor: Campos[K]) =>
    setCampos((atual) => ({ ...atual, [chave]: valor }))

  async function salvar() {
    setSalvando(true)
    setMensagem(null)
    const corpo = { ...campos, ...(nova ? {} : { photos: fotos.map(({ id, alt }) => ({ id, alt })) }) }
    const resposta = await fetch(nova ? '/api/gente/newsletter' : `/api/gente/newsletter/${params.id}`, {
      method: nova ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    setSalvando(false)
    if (!resposta.ok) {
      setMensagem({ tipo: 'erro', texto: 'Confira os campos: título, data, unidade e texto são obrigatórios.' })
      return
    }
    if (nova) {
      const post = await resposta.json()
      router.replace(`/gente/newsletter/${post.id}`)
      return
    }
    setMensagem({ tipo: 'ok', texto: 'Campanha salva. O site é atualizado em instantes.' })
  }

  async function enviarFotos(arquivos: FileList | null) {
    if (!arquivos?.length) return
    setMensagem(null)
    for (const arquivo of Array.from(arquivos)) {
      setEnviando(arquivo.name)
      try {
        const { blob, width, height, blur } = await reduzirFoto(arquivo)
        const dados = new FormData()
        dados.append('arquivo', blob, 'foto.jpg')
        dados.append('alt', `${campos.title} · ${campos.unit}`.trim())
        dados.append('width', String(width))
        dados.append('height', String(height))
        dados.append('blur', blur)
        const resposta = await fetch(`/api/gente/newsletter/${params.id}/fotos`, { method: 'POST', body: dados })
        if (!resposta.ok) throw new Error((await resposta.json().catch(() => null))?.error ?? 'Falha no envio')
        const foto = await resposta.json()
        setFotos((atual) => [...atual, foto])
      } catch (erro) {
        setMensagem({
          tipo: 'erro',
          texto: `Não foi possível enviar "${arquivo.name}": ${erro instanceof Error ? erro.message : 'erro desconhecido'}. Use JPG, PNG ou WebP.`,
        })
        break
      }
    }
    setEnviando(null)
  }

  async function removerFoto(id: string) {
    if (!confirm('Remover esta foto da campanha?')) return
    const resposta = await fetch(`/api/gente/newsletter/${params.id}/fotos/${id}`, { method: 'DELETE' })
    if (resposta.ok) setFotos((atual) => atual.filter((f) => f.id !== id))
  }

  function mover(indice: number, direcao: -1 | 1) {
    setFotos((atual) => {
      const nova = [...atual]
      const alvo = indice + direcao
      if (alvo < 0 || alvo >= nova.length) return atual
      ;[nova[indice], nova[alvo]] = [nova[alvo], nova[indice]]
      return nova
    })
  }

  async function excluirCampanha() {
    if (!confirm('Excluir esta campanha e todas as fotos? Ela sai do site imediatamente.')) return
    const resposta = await fetch(`/api/gente/newsletter/${params.id}`, { method: 'DELETE' })
    if (resposta.ok) router.replace('/gente/newsletter')
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando campanha…
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <Link
          href="/gente/newsletter"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Newsletter do site
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">
          {nova ? 'Nova campanha' : campos.title || 'Campanha'}
        </h1>
        <p className="text-slate-400 text-sm">
          {nova
            ? 'Preencha os dados e salve. Em seguida você adiciona as fotos.'
            : 'As fotos passam sozinhas no site, na ordem abaixo.'}
        </p>
      </div>

      {mensagem && (
        <p
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
            mensagem.tipo === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {mensagem.tipo === 'ok' && <CheckCircle2 className="w-4 h-4" />}
          {mensagem.texto}
        </p>
      )}

      <section className="rounded-2xl bg-white/3 border border-white/8 p-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={rotulo} htmlFor="title">Título</label>
          <input id="title" className={campo} value={campos.title} maxLength={80}
            placeholder="Ex.: Dia Nacional do Trânsito" onChange={(e) => alterar('title', e.target.value)} />
        </div>
        <div>
          <label className={rotulo} htmlFor="dateLabel">Data exibida no site</label>
          <input id="dateLabel" className={campo} value={campos.dateLabel} maxLength={20}
            placeholder="Ex.: 25 set ou Setembro" onChange={(e) => alterar('dateLabel', e.target.value)} />
        </div>
        <div>
          <label className={rotulo} htmlFor="eventDate">Data da campanha (ordena a lista)</label>
          <input id="eventDate" type="date" className={campo} value={campos.eventDate}
            onChange={(e) => alterar('eventDate', e.target.value)} />
        </div>
        <div>
          <label className={rotulo} htmlFor="company">Empresa</label>
          <select id="company" className={campo} value={campos.company}
            onChange={(e) => alterar('company', e.target.value)}>
            {HUB_COMPANIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo} htmlFor="unit">Unidade</label>
          <input id="unit" className={campo} value={campos.unit} maxLength={60}
            placeholder="Ex.: Sousa (PB)" onChange={(e) => alterar('unit', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={rotulo} htmlFor="summary">Texto ({campos.summary.length}/320)</label>
          <textarea id="summary" rows={3} className={campo} value={campos.summary} maxLength={320}
            placeholder="O que aconteceu, em uma ou duas frases."
            onChange={(e) => alterar('summary', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className={rotulo} htmlFor="tagline">Frase de destaque (opcional)</label>
          <input id="tagline" className={campo} value={campos.tagline} maxLength={80}
            placeholder="Ex.: Cuidar também é um ato de amor." onChange={(e) => alterar('tagline', e.target.value)} />
        </div>
        <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={campos.published}
            onChange={(e) => alterar('published', e.target.checked)} className="accent-current" />
          Publicada no site
          <span className="text-slate-500 text-xs">(desmarque para deixar como rascunho)</span>
        </label>
      </section>

      {!nova && (
        <section className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/8">
            <p className="text-white text-sm font-medium">Fotos ({fotos.length}/12)</p>
            <label
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer ${
                enviando || fotos.length >= 12
                  ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                  : 'bg-brand-500/15 border border-brand-500/30 text-brand-400 hover:bg-brand-500/20'
              }`}
            >
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              {enviando ? `Enviando ${enviando}…` : 'Adicionar fotos'}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only"
                disabled={!!enviando || fotos.length >= 12}
                onChange={(e) => { enviarFotos(e.target.files); e.target.value = '' }} />
            </label>
          </div>
          {fotos.length === 0 ? (
            <p className="p-4 text-slate-500 text-sm">
              Nenhuma foto ainda. A campanha só aparece no site depois da primeira foto.
            </p>
          ) : (
            <ul className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fotos.map((foto, indice) => (
                <li key={foto.id} className="rounded-xl border border-white/8 bg-black/20 overflow-hidden">
                  <div className="relative aspect-[4/3] bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/public/newsletter/foto/${foto.id}`} alt={foto.alt}
                      className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
                      {indice + 1}
                    </span>
                  </div>
                  <div className="p-2 space-y-2">
                    <input aria-label={`Descrição da foto ${indice + 1}`} className={`${campo} text-xs`}
                      value={foto.alt} maxLength={160}
                      onChange={(e) => setFotos((atual) =>
                        atual.map((f) => (f.id === foto.id ? { ...f, alt: e.target.value } : f)))} />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => mover(indice, -1)} disabled={indice === 0}
                        aria-label="Mover para antes"
                        className="p-1.5 rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 hover:bg-white/5">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => mover(indice, 1)} disabled={indice === fotos.length - 1}
                        aria-label="Mover para depois"
                        className="p-1.5 rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 hover:bg-white/5">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => removerFoto(foto.id)} aria-label="Remover foto"
                        className="ml-auto p-1.5 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="px-4 pb-4 text-slate-500 text-xs">
            A descrição de cada foto é lida por leitores de tela. A ordem e as descrições valem depois de
            salvar.
          </p>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={salvar} disabled={salvando}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors disabled:opacity-50">
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {nova ? 'Criar campanha' : 'Salvar alterações'}
        </button>
        {!nova && (
          <button type="button" onClick={excluirCampanha}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 text-red-300 text-sm hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" />
            Excluir campanha
          </button>
        )}
      </div>
    </div>
  )
}
