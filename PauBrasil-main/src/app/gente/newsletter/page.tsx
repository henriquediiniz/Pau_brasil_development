'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ChevronLeft, ExternalLink, Eye, EyeOff, ImageOff, Loader2, Newspaper, Plus } from 'lucide-react'
import { HUB_COMPANIES } from '@/lib/hub-content'

interface Foto {
  id: string
  alt: string
}

interface Campanha {
  id: string
  title: string
  dateLabel: string
  eventDate: string
  company: string
  unit: string
  published: boolean
  photos: Foto[]
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

const nomeEmpresa = (slug: string) => HUB_COMPANIES.find((c) => c.slug === slug)?.name ?? slug

export default function NewsletterGestaoPage() {
  const { data, error, isLoading } = useSWR<Campanha[]>('/api/gente/newsletter', fetcher)
  const publicadas = data?.filter((c) => c.published && c.photos.length > 0).length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/gente"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Gente
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Newsletter do site</h1>
          <p className="text-slate-400 text-sm">
            Campanhas internas que aparecem no topo do site do grupo. As mais recentes vêm primeiro.
          </p>
          <p className="text-xs mt-1 text-slate-500">
            {publicadas} {publicadas === 1 ? 'campanha no ar' : 'campanhas no ar'} · só entram no site
            as publicadas que têm pelo menos uma foto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/#newsletter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver no site
          </a>
          <Link
            href="/gente/newsletter/nova"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova campanha
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando campanhas…
        </div>
      )}
      {error && <p className="text-red-400 text-sm">Não foi possível carregar as campanhas.</p>}

      {data && data.length === 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-8 text-center">
          <Newspaper className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <p className="text-white text-sm font-medium">Nenhuma campanha cadastrada</p>
          <p className="text-slate-400 text-xs mt-1">Crie a primeira para ela aparecer no topo do site.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((campanha) => {
            const capa = campanha.photos[0]
            const noAr = campanha.published && campanha.photos.length > 0
            return (
              <li key={campanha.id}>
                <Link
                  href={`/gente/newsletter/${campanha.id}`}
                  className="group block rounded-2xl bg-white/3 border border-white/8 overflow-hidden hover:border-brand-500/30 transition-colors"
                >
                  <div className="relative aspect-[16/9] bg-black/30">
                    {capa ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/public/newsletter/foto/${capa.id}`}
                        alt={capa.alt}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500 text-xs">
                        <ImageOff className="w-5 h-5" />
                        Sem fotos
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        noAr
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-black/50 text-slate-300 border border-white/10'
                      }`}
                    >
                      {noAr ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {noAr ? 'No site' : campanha.published ? 'Sem fotos' : 'Rascunho'}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      {campanha.dateLabel} · {nomeEmpresa(campanha.company)} · {campanha.unit}
                    </p>
                    <p className="text-white font-medium mt-1 group-hover:text-brand-300 transition-colors">
                      {campanha.title}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {campanha.photos.length} {campanha.photos.length === 1 ? 'foto' : 'fotos'}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
