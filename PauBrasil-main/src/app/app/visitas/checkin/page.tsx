'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Navigation, ChevronRight } from 'lucide-react'
import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'

interface Operation {
  id: string
  slug: string
  name: string
  latitude: number
  longitude: number
  radiusMeters: number
}

interface Obrigatoria {
  operationSlug: string
  quantidadeMinima: number
  visitasValidas: number
  cumprida: boolean
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function CheckinSelectPage() {
  const router = useRouter()
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)

  const { data: opsData, isLoading: opsLoading } = useSWR<Operation[]>('/api/visitas/operacoes', fetcher)
  const { data: obrigData, isLoading: obrigLoading } = useSWR<Obrigatoria[]>('/api/visitas/obrigatorias', fetcher)

  const loading = opsLoading || obrigLoading
  const ops: Operation[] = Array.isArray(opsData) ? opsData : []
  const obrigatorias: Obrigatoria[] = Array.isArray(obrigData) ? obrigData : []

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const obrigMap = new Map(obrigatorias.map(o => [o.operationSlug, o]))

  const opsWithDist = ops.map(op => ({
    ...op,
    distance: userCoords
      ? haversineMeters(userCoords.lat, userCoords.lon, op.latitude, op.longitude)
      : null,
    obrig: obrigMap.get(op.slug) ?? null,
  })).sort((a, b) => {
    // Ordem: obrigatórias pendentes → obrigatórias cumpridas → demais
    const groupA = a.obrig ? (a.obrig.cumprida ? 1 : 0) : 2
    const groupB = b.obrig ? (b.obrig.cumprida ? 1 : 0) : 2
    if (groupA !== groupB) return groupA - groupB
    // dentro do grupo: por distância
    if (a.distance == null || b.distance == null) return 0
    return a.distance - b.distance
  })

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-400" /> Onde você está?
        </h1>
        <p className="text-slate-500 text-sm mt-1">Selecione a filial que está visitando</p>
      </div>

      {userCoords && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <Navigation className="w-3.5 h-3.5" />
          <span>GPS ativo — filiais ordenadas por proximidade</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="w-4 h-4 rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {opsWithDist.map((op, i) => {
            const isNear = op.distance != null && op.distance <= op.radiusMeters
            const ob = op.obrig
            return (
              <motion.button
                key={op.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/app/visitas/checkin/${op.slug}`)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isNear ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                  <MapPin className={`w-5 h-5 ${isNear ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold">{op.name}</p>
                    {ob && (
                      ob.cumprida ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          Obrigatória ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          Obrigatória · {ob.visitasValidas}/{ob.quantidadeMinima}
                        </span>
                      )
                    )}
                  </div>
                  {op.distance != null ? (
                    <p className={`text-xs mt-0.5 ${isNear ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isNear ? `✓ Você está aqui · ${fmtDist(op.distance)}` : fmtDist(op.distance) + ' de distância'}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5">Raio: {op.radiusMeters}m</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
