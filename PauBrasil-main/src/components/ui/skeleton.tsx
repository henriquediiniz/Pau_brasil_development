/** Skeleton components — use for loading states across the app */

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className ?? ''}`} />
}
