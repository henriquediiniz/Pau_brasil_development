'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap, Award, Users, Clock, TrendingUp, BookOpen,
  ArrowLeft, Loader2, Printer, BarChart3, Star, Building2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface KPIs {
  totalAlunos: number
  totalCertificados: number
  taxaConclusao: number
  mediaNotaQuiz: number | null
  horasAssistidas: number
  totalCursos: number
}

interface CursoStats {
  id: string; titulo: string; totalEpisodios: number
  alunos: number; certificados: number; taxaConclusao: number; mediaNotaQuiz: number | null
}

interface AlunoTop { name: string; photoUrl: string | null; company: string; total: number }
interface EmpresaStats { empresa: string; certificados: number; alunos: number }
interface MesStats { label: string; certificados: number }
interface Recente { userName: string; company: string; temporadaTitulo: string; emitidoEm: string }

interface Relatorio {
  kpis: KPIs
  porCurso: CursoStats[]
  topAlunos: AlunoTop[]
  porEmpresa: EmpresaStats[]
  evolucaoMensal: MesStats[]
  recentes: Recente[]
}

const PERIODOS = [
  { key: 'mes', label: 'Este mês' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'ano', label: 'Este ano' },
  { key: 'tudo', label: 'Tudo' },
]

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const raf = useRef<number | null>(null)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(ease * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])
  return value
}

function KPICard({ icon: Icon, label, value, suffix = '', color, delay = 0 }: {
  icon: React.ElementType; label: string; value: number; suffix?: string; color: string; delay?: number
}) {
  const count = useCounter(value)
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="rounded-2xl bg-white/3 border border-white/8 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-3xl font-display font-black text-white tracking-tight">
        {count.toLocaleString('pt-BR')}{suffix}
      </div>
    </motion.div>
  )
}

function BarChart({ data }: { data: MesStats[] }) {
  const max = Math.max(...data.map(d => d.certificados), 1)
  return (
    <div className="flex items-end gap-2 h-28 mt-4">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">{d.certificados}</span>
          <div className="w-full rounded-t-lg overflow-hidden bg-white/5" style={{ height: 80 }}>
            <motion.div
              className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400"
              initial={{ height: 0 }}
              animate={{ height: `${(d.certificados / max) * 100}%` }}
              transition={{ delay: i * 0.08 + 0.3, duration: 0.6, ease: 'easeOut' }}
              style={{ marginTop: 'auto' }}
            />
          </div>
          <span className="text-[10px] text-slate-600">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function MiniBar({ pct, color = 'gradient-brand' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
      <span className="text-xs font-bold text-slate-300 w-9 text-right">{pct}%</span>
    </div>
  )
}

export default function UPBRelatorioPage() {
  const [periodo, setPeriodo] = useState('mes')
  const [data, setData] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/upb/relatorio?periodo=${periodo}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [periodo])

  const maxEmpresa = Math.max(...(data?.porEmpresa.map(e => e.certificados) ?? [1]), 1)

  return (
    <div className="max-w-6xl mx-auto space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Link href="/admin/upb" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Universidade
            </Link>
          </div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" /> Relatório de Aprendizagem
          </h1>
          <p className="text-slate-400 text-sm mt-1">Universidade Pau Brasil — indicadores de desenvolvimento</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/8">
            {PERIODOS.map(p => (
              <button key={p.key} onClick={() => setPeriodo(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${periodo === p.key ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-500 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-sm transition-all">
            <Printer className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-black">Universidade Pau Brasil — Relatório de Aprendizagem</h1>
        <p className="text-gray-500 text-sm">Período: {PERIODOS.find(p => p.key === periodo)?.label}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : !data ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-12 text-center text-slate-500">
          Erro ao carregar relatório.
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard icon={Users} label="Alunos ativos" value={data.kpis.totalAlunos} color="bg-purple-500/30" delay={0} />
            <KPICard icon={Award} label="Certificados" value={data.kpis.totalCertificados} color="bg-emerald-500/30" delay={0.05} />
            <KPICard icon={TrendingUp} label="Taxa de conclusão" value={data.kpis.taxaConclusao} suffix="%" color="bg-brand-500/30" delay={0.1} />
            <KPICard icon={Star} label="Média nas provas" value={data.kpis.mediaNotaQuiz ?? 0} suffix="%" color="bg-amber-500/30" delay={0.15} />
            <KPICard icon={Clock} label="Horas assistidas" value={data.kpis.horasAssistidas} color="bg-blue-500/30" delay={0.2} />
            <KPICard icon={BookOpen} label="Cursos ativos" value={data.kpis.totalCursos} color="bg-pink-500/30" delay={0.25} />
          </div>

          {/* Evolução + Top Alunos */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Bar chart */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="lg:col-span-3 rounded-2xl bg-white/3 border border-white/8 p-6">
              <h2 className="text-sm font-medium text-white flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Evolução de Certificados
              </h2>
              <p className="text-xs text-slate-500">Últimos 6 meses</p>
              {data.evolucaoMensal.every(m => m.certificados === 0) ? (
                <div className="flex items-center justify-center h-28 mt-4 text-slate-600 text-sm">Nenhum certificado emitido ainda.</div>
              ) : (
                <BarChart data={data.evolucaoMensal} />
              )}
            </motion.div>

            {/* Top alunos */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="lg:col-span-2 rounded-2xl bg-white/3 border border-white/8 p-6">
              <h2 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-yellow-400" /> Top Colaboradores
              </h2>
              {data.topAlunos.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-6">Nenhum certificado ainda.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topAlunos.map((a, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0
                        ${i === 0 ? 'bg-yellow-400/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/5 text-slate-500'}`}>
                        {i + 1}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400 overflow-hidden shrink-0">
                        {a.photoUrl ? <Image src={a.photoUrl} alt={a.name} width={28} height={28} className="w-full h-full object-cover" /> : a.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{a.name.split(' ').slice(0, 2).join(' ')}</p>
                        <p className="text-[10px] text-slate-600 truncate">{a.company?.replace('Pau Brasil ', '')}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Award className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-400">{a.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Performance por curso */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-sm font-medium text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-400" /> Performance por Curso
              </h2>
            </div>
            {data.porCurso.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-10">Nenhum curso cadastrado.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-2.5 text-[10px] font-medium text-slate-600 uppercase tracking-widest">
                  <span className="col-span-4">Curso</span>
                  <span className="col-span-1 text-center">Aulas</span>
                  <span className="col-span-1 text-center">Alunos</span>
                  <span className="col-span-1 text-center">Certs.</span>
                  <span className="col-span-3">Conclusão</span>
                  <span className="col-span-2">Média prova</span>
                </div>
                {data.porCurso.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.04 }}
                    className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-white/2 transition-colors">
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{c.titulo}</p>
                      <p className="text-xs text-slate-600">{c.totalEpisodios} aula{c.totalEpisodios !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-bold text-slate-300">{c.totalEpisodios}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-bold text-slate-300">{c.alunos}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-bold text-emerald-400">{c.certificados}</span>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <MiniBar pct={c.taxaConclusao}
                        color={c.taxaConclusao >= 70 ? 'bg-emerald-500' : c.taxaConclusao >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                    </div>
                    <div className="col-span-2">
                      {c.mediaNotaQuiz !== null ? (
                        <MiniBar pct={c.mediaNotaQuiz} color="bg-purple-500" />
                      ) : (
                        <span className="text-xs text-slate-600">Sem prova</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Por empresa + Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Por empresa */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="lg:col-span-2 rounded-2xl bg-white/3 border border-white/8 p-6">
              <h2 className="text-sm font-medium text-white flex items-center gap-2 mb-5">
                <Building2 className="w-4 h-4 text-brand-400" /> Certificados por Empresa
              </h2>
              {data.porEmpresa.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-6">Sem dados.</p>
              ) : (
                <div className="space-y-4">
                  {data.porEmpresa.map((e, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-300 truncate max-w-[60%]">{e.empresa.replace('Pau Brasil ', '')}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500">{e.alunos} alunos</span>
                          <span className="font-bold text-purple-400">{e.certificados} certs</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((e.certificados / maxEmpresa) * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.08 + 0.5 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Certificados recentes */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="lg:col-span-3 rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-sm font-medium text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> Certificados Recentes
                </h2>
              </div>
              {data.recentes.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-10">Nenhum certificado emitido ainda.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {data.recentes.map((r, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.03 }}
                      className="flex items-center gap-4 px-6 py-3 hover:bg-white/2 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{r.userName}</p>
                        <p className="text-xs text-slate-500 truncate">{r.temporadaTitulo}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500">{r.company?.replace('Pau Brasil ', '')}</p>
                        <p className="text-[10px] text-slate-600">
                          {new Date(r.emitidoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}
