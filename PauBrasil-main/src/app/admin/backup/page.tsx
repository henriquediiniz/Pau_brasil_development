'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HardDrive, Download, Upload, Trash2, RefreshCw, CheckCircle2,
  XCircle, Clock, AlertTriangle, Settings2, Save,
} from 'lucide-react'

interface BackupJob {
  id: string
  type: string
  status: string
  trigger: string
  triggeredBy: string | null
  blobUrl: string | null
  sizeBytes: string | null
  rowCounts: Record<string, number> | null
  errorMsg: string | null
  startedAt: string
  finishedAt: string | null
}

interface BlobMeta {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

interface BackupConfig {
  backup_enabled: string
  backup_hour_utc: string
  backup_retention_days: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    DONE:    { label: 'Completo',    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    FAILED:  { label: 'Falhou',      cls: 'bg-red-500/10 text-red-400 border-red-500/20',             icon: <XCircle className="w-3 h-3" /> },
    RUNNING: { label: 'Executando',  cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    PENDING: { label: 'Aguardando',  cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20',       icon: <Clock className="w-3 h-3" /> },
  }
  const s = map[status] ?? map.PENDING
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  )
}

const UTC_HOURS = Array.from({ length: 24 }, (_, i) => {
  const brt = ((i - 3) + 24) % 24
  return { value: String(i), label: `${String(i).padStart(2, '0')}:00 UTC (${String(brt).padStart(2, '0')}:00 BRT)` }
})

export default function BackupPage() {
  const [jobs, setJobs] = useState<BackupJob[]>([])
  const [blobs, setBlobs] = useState<BlobMeta[]>([])
  const [config, setConfig] = useState<BackupConfig>({ backup_enabled: 'true', backup_hour_utc: '3', backup_retention_days: '30' })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [dryRun, setDryRun] = useState(true)
  const [importResult, setImportResult] = useState<{ rowCounts: Record<string, number>; errors: string[]; dryRun: boolean } | null>(null)
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/backup')
      const data = await res.json()
      setJobs(data.jobs ?? [])
      setBlobs(data.blobs ?? [])
      if (data.config) setConfig(c => ({ ...c, ...data.config }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/backup/export', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      showToast('Backup exportado com sucesso!')
      await load()
    } catch (e: any) {
      showToast(e.message ?? 'Falha ao exportar', false)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete(jobId: string) {
    setDeleteId(jobId)
    try {
      const res = await fetch(`/api/admin/backup/${jobId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir')
      showToast('Backup excluído')
      await load()
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setDeleteId(null)
    }
  }

  /** Restaura um backup guardado (o servidor lê do Blob; o upload da tela não passa de 4,5 MB). */
  async function restoreJob(jobId: string, simular: boolean) {
    if (!simular && !window.confirm('Restaurar este backup sobre os dados atuais? Os registros do arquivo serão gravados por cima dos existentes.')) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, dryRun: simular }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      setImportResult(data)
      showToast(simular ? 'Simulação concluída: veja o resultado no card de importação.' : 'Backup restaurado com sucesso!')
      if (!simular) await load()
    } catch (e: any) {
      showToast(e.message ?? 'Falha ao restaurar', false)
    } finally {
      setImporting(false)
    }
  }

  async function handleImport() {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    const form = new FormData()
    form.append('file', importFile)
    form.append('dryRun', String(dryRun))
    try {
      const res = await fetch('/api/admin/backup/import', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      setImportResult(data)
      if (!dryRun) {
        showToast('Backup importado com sucesso!')
        await load()
      }
    } catch (e: any) {
      showToast(e.message ?? 'Falha ao importar', false)
    } finally {
      setImporting(false)
    }
  }

  async function handleSaveConfig() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/backup/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      showToast('Configurações salvas')
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setSaving(false)
    }
  }

  const lastDone = jobs.find(j => j.status === 'DONE' && j.type === 'EXPORT')
  const totalSize = blobs.reduce((s, b) => s + b.size, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm shadow-xl ${
              toast.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}
          >
            {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
            <HardDrive className="w-3 h-3" />
            Sistema
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Backup & Restauração</h1>
          <p className="text-slate-400 text-sm mt-1">
            Exporte, importe e agende backups completos do banco de dados
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 items-center text-xs text-slate-500">
          <span className="px-2 py-1 rounded-lg bg-white/3 border border-white/8">
            {blobs.length} backup{blobs.length !== 1 ? 's' : ''}
          </span>
          {totalSize > 0 && (
            <span className="px-2 py-1 rounded-lg bg-white/3 border border-white/8">
              {formatBytes(totalSize)} total
            </span>
          )}
          {lastDone && (
            <span className="px-2 py-1 rounded-lg bg-white/3 border border-white/8">
              Último {timeAgo(lastDone.startedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all"
        >
          {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Exportando…' : 'Exportar Agora'}
        </button>
        <button
          onClick={() => { setShowImport(true); setImportResult(null); setImportFile(null); setDryRun(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/15 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Importar Backup
        </button>
      </div>

      {/* Backup list */}
      <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-brand-400" />
          <span className="text-white font-medium text-sm">Backups armazenados</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Nenhum backup encontrado. Clique em &quot;Exportar Agora&quot; para criar o primeiro.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {jobs.map(job => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">
                      {new Date(job.startedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${job.trigger === 'cron' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                      {job.trigger === 'cron' ? 'Auto' : 'Manual'}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {job.sizeBytes && <span>{formatBytes(Number(job.sizeBytes))}</span>}
                    {job.rowCounts && (
                      <span>{Object.values(job.rowCounts as Record<string, number>).reduce((a, b) => a + b, 0).toLocaleString()} registros</span>
                    )}
                    {job.errorMsg && (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{job.errorMsg.slice(0, 80)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {job.blobUrl && (
                    <a
                      href={`/api/admin/backup/${job.id}/download`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
                      title="Download"
                      download
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {job.blobUrl && job.type !== 'IMPORT' && (
                    <>
                      <button
                        onClick={() => restoreJob(job.id, true)}
                        disabled={importing}
                        className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-40"
                        title="Simula a restauração sem gravar nada"
                      >
                        Simular
                      </button>
                      <button
                        onClick={() => restoreJob(job.id, false)}
                        disabled={importing}
                        className="px-2 py-1 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                        title="Restaura este backup sobre os dados atuais"
                      >
                        Restaurar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={deleteId === job.id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    title="Excluir"
                  >
                    {deleteId === job.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Config card */}
      <div className="rounded-2xl bg-white/3 border border-white/8 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-brand-400" />
          <span className="text-white font-medium text-sm">Configurações</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8">
            <div>
              <div className="text-white text-sm font-medium">Backup automático</div>
              <div className="text-slate-500 text-xs">Cron diário às 03:00 UTC</div>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, backup_enabled: c.backup_enabled === 'true' ? 'false' : 'true' }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${config.backup_enabled === 'true' ? 'bg-brand-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config.backup_enabled === 'true' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Hour */}
          <div className="p-3 rounded-xl bg-white/3 border border-white/8">
            <label className="text-white text-sm font-medium block mb-1.5">Horário (UTC)</label>
            <select
              value={config.backup_hour_utc}
              onChange={e => setConfig(c => ({ ...c, backup_hour_utc: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-brand-500/50"
            >
              {UTC_HOURS.map(h => (
                <option key={h.value} value={h.value} className="bg-[#1a1a2e]">{h.label}</option>
              ))}
            </select>
            <p className="text-slate-600 text-xs mt-1">Para alterar o cron real, edite vercel.json</p>
          </div>

          {/* Retention */}
          <div className="p-3 rounded-xl bg-white/3 border border-white/8">
            <label className="text-white text-sm font-medium block mb-1.5">Retenção (dias)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={config.backup_retention_days}
              onChange={e => setConfig(c => ({ ...c, backup_retention_days: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-brand-500/50"
            />
            <p className="text-slate-600 text-xs mt-1">Backups mais antigos são apagados automaticamente</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/8 disabled:opacity-50 transition-colors"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar configurações
          </button>
        </div>
      </div>

      {/* Import modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowImport(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="text-white font-semibold">Importar Backup</h3>
              </div>

              <div
                className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/30 hover:bg-amber-500/3 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {importFile ? (
                  <div>
                    <p className="text-white text-sm font-medium">{importFile.name}</p>
                    <p className="text-slate-500 text-xs mt-1">{formatBytes(importFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Clique para selecionar arquivo <strong>.json.gz</strong></p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json.gz"
                  className="hidden"
                  onChange={e => { setImportFile(e.target.files?.[0] ?? null); setImportResult(null) }}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={e => setDryRun(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-slate-300 text-sm">Simulação (dry-run) — não altera dados</span>
              </label>

              {importResult && (
                <div className="rounded-xl bg-white/3 border border-white/8 p-3 max-h-48 overflow-y-auto space-y-1">
                  <p className="text-xs font-medium text-slate-400 mb-2">
                    {importResult.dryRun ? 'Simulação' : 'Resultado'} — {Object.values(importResult.rowCounts).reduce((a, b) => a + b, 0).toLocaleString()} registros
                  </p>
                  {Object.entries(importResult.rowCounts).filter(([, v]) => v > 0).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-400">{k}</span>
                      <span className="text-white">{v.toLocaleString()}</span>
                    </div>
                  ))}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/8">
                      {importResult.errors.map((e, i) => (
                        <p key={i} className="text-red-400 text-xs">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowImport(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/15 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {importing ? 'Importando…' : dryRun ? 'Simular importação' : 'Importar dados'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
