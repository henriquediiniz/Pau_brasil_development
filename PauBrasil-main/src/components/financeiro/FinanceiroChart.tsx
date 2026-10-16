'use client'

import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

export interface FinanceiroChartPoint {
  mes: string
  orcado: number
  real?: number
  tendencia?: number
}

interface Props {
  data: FinanceiroChartPoint[]
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const fmtK = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
  : String(v)

export default function FinanceiroChart({ data }: Props) {
  return (
    <>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="mes"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={62}
            tickFormatter={fmtK}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 12,
              fontSize: 12,
              color: '#e2e8f0',
            }}
            formatter={(value, name) => [fmtBRL(Number(value)), String(name)]}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 12 }} />
          <Bar dataKey="orcado"    name="Orçado"    fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="real"      name="Real"      fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Line dataKey="tendencia" name="Tendência" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} connectNulls={false} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs text-slate-500 flex-wrap pt-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />Orçado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Real (meses lançados)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-indigo-400 inline-block" />Tendência</span>
      </div>
    </>
  )
}
