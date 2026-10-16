import { MESES } from '@/lib/format'

/** Skeleton components — use for loading states across the app */

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className ?? ''}`} />
}

/** Simulates a full OBZ package card (header + 3 data rows) */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/3 border border-white/8 p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Simulates a single table row with N columns */
export function SkeletonTableRow({ cols = 7 }: { cols?: number }) {
  const widths = ['w-36', 'w-24', 'w-40', 'w-12', 'w-20', 'w-20', 'w-20']
  return (
    <div className="px-4 py-3 border-b border-white/5 flex gap-4 items-center animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${widths[i] ?? 'w-16'}`} />
      ))}
    </div>
  )
}

/** Hero stats + gauge do dashboard OBZ */
export function SkeletonOBZHero() {
  return (
    <div className="rounded-3xl p-8 bg-white/3 border border-white/8 animate-pulse space-y-4">
      <Skeleton className="h-3 w-48" />
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 flex-1 rounded-xl" />)}
      </div>
    </div>
  )
}

/** Tabela de lançamentos OBZ com colunas de meses */
export function SkeletonOBZTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden animate-pulse">
      <div className="flex gap-2 px-4 py-3 border-b border-white/8 bg-white/3">
        <Skeleton className="h-3 w-48 flex-shrink-0" />
        {MESES.map((_, i) => (
          <Skeleton key={i} className="h-3 w-14 flex-shrink-0" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2 px-4 py-3 border-b border-white/5">
          <Skeleton className="h-3 w-48 flex-shrink-0" />
          {MESES.map((_, j) => (
            <Skeleton key={j} className="h-3 w-14 flex-shrink-0" />
          ))}
        </div>
      ))}
    </div>
  )
}
