'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 mb-8">
        <Skeleton className="h-4 w-32 bg-white/5" />
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-64 bg-white/5" />
            <Skeleton className="h-4 w-40 bg-white/5" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full bg-white/5" />
        </div>
      </div>

      {/* Progress Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
              <Skeleton className="h-6 w-12 bg-white/5" />
            </div>
            <Skeleton className="h-4 w-24 mb-2 bg-white/5" />
            <Skeleton className="h-3 w-48 mb-4 bg-white/5" />
            <Skeleton className="h-2 w-full rounded-full bg-white/5" />
          </div>
        ))}
      </div>

      {/* Task List Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32 bg-white/5" />
          <Skeleton className="h-6 w-24 bg-white/5" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5"
          >
            <Skeleton className="h-6 w-6 rounded-full bg-white/5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 bg-white/5" />
              <Skeleton className="h-3 w-1/2 bg-white/5" />
            </div>
            <Skeleton className="h-4 w-8 bg-white/5" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
