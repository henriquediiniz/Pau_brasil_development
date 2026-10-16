'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileUp, Loader2, X } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import {
  casarArquivos,
  type Confianca,
  type PessoaComLaudo,
} from '@/lib/gente/laudo-arquivo'

/**
 * Anexar vários laudos de uma vez.
 *
 * O RH recebe os laudos como cada um manda — "HELIO NASCIMENTO LAUDO.pdf",
 * "JOSILDO VIEIRA DE SOUSA_DOC_PCD.pdf" — e abrir o cadastro de pessoa por
 * pessoa é o que fazia o trabalho não andar.
 *
 * O sistema dá o palpite pelo nome do arquivo, mas **não anexa sozinho**:
 * cada linha mostra para quem vai, e o que ficou em dúvida exige escolha
 * manual. Anexar laudo na pessoa errada é colocar dado de saúde de alguém no
 * prontuário de outro — um erro que não se desfaz avisando.
 */

const TOM: Record<Confianca, { rotulo: string; classe: string }> = {
  exata: { rotulo: 'nome confere', classe: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
  provavel: { rotulo: 'confira', classe: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
  ambigua: { rotulo: 'escolha', classe: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
  nenhuma: { rotulo: 'sem correspondência', classe: 'text-slate-400 border-white/10 bg-white/5' },
}

interface Linha {
  file: File
  nomeNoArquivo: string
  confianca: Confianca
  candidatos: PessoaComLaudo[]
  /** Para quem vai. Vazio = não enviar. */
  destinoId: string
  estado: 'pendente' | 'enviando' | 'ok' | 'erro'
  erro?: string
}

export function LaudosEmLote({
  pessoas,
  onFechar,
  onConcluido,
}: {
  pessoas: PessoaComLaudo[]
  onFechar: () => void
  onConcluido: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [enviando, setEnviando] = useState(false)

  const receber = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const arquivos = Array.from(files)
      const casados = casarArquivos(arquivos.map((f) => f.name), pessoas)

      setLinhas(
        arquivos.map((file, i) => ({
          file,
          nomeNoArquivo: casados[i].nomeNoArquivo,
          confianca: casados[i].confianca,
          candidatos: casados[i].candidatos,
          /*
            Só o palpite sem ambiguidade vem preenchido. Ambíguo e sem
            correspondência ficam vazios de propósito: o RH escolhe, e um
            arquivo que ninguém escolheu não é enviado.
          */
          destinoId:
            casados[i].confianca === 'exata' || casados[i].confianca === 'provavel'
              ? casados[i].candidatos[0].id
              : '',
          estado: 'pendente',
        }))
      )
    },
    [pessoas]
  )

  const prontas = useMemo(
    () => linhas.filter((l) => l.destinoId && l.estado !== 'ok'),
    [linhas]
  )

  const enviar = useCallback(async () => {
    setEnviando(true)
    let enviados = 0

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i]
      if (!linha.destinoId || linha.estado === 'ok') continue

      setLinhas((atual) =>
        atual.map((l, j) => (j === i ? { ...l, estado: 'enviando', erro: undefined } : l))
      )

      try {
        const form = new FormData()
        form.append('arquivo', linha.file)

        const res = await fetch(`/api/gente/pcd/${linha.destinoId}/laudo`, {
          method: 'POST',
          body: form,
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Não foi possível anexar')

        enviados++
        setLinhas((atual) => atual.map((l, j) => (j === i ? { ...l, estado: 'ok' } : l)))
      } catch (err) {
        // Uma falha não interrompe a leva: o resto continua, e a linha que
        // falhou fica marcada para reenvio.
        setLinhas((atual) =>
          atual.map((l, j) =>
            j === i
              ? {
                  ...l,
                  estado: 'erro',
                  erro: err instanceof Error ? err.message : 'Falhou',
                }
              : l
          )
        )
      }
    }

    setEnviando(false)
    if (enviados > 0) {
      toast({ title: `${enviados} laudo(s) anexado(s)`, variant: 'success' })
      onConcluido()
    }
  }, [linhas, onConcluido])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Anexar laudos em lote"
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-surface border border-white/10 p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Anexar vários laudos</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Escolha os arquivos de uma vez. O sistema procura a pessoa pelo nome do arquivo e
              mostra para quem vai cada um — nada é anexado sem você confirmar.
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => receber(e.target.files)}
          className="hidden"
        />

        <button
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="w-full flex flex-col items-center gap-2 py-8 rounded-xl border border-dashed border-white/15 text-slate-400 hover:border-brand-500/40 hover:text-brand-400 disabled:opacity-40 transition-colors"
        >
          <FileUp className="w-6 h-6" />
          <span className="text-sm">
            {linhas.length > 0 ? 'Trocar os arquivos' : 'Escolher os arquivos'}
          </span>
          <span className="text-[11px] text-slate-500">PDF, JPEG, PNG ou WebP</span>
        </button>

        {linhas.length > 0 && (
          <ul className="space-y-2">
            {linhas.map((linha, i) => (
              <li
                key={`${linha.file.name}-${i}`}
                className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 text-sm truncate">{linha.file.name}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] border rounded px-1.5 py-0.5 ${
                        TOM[linha.confianca].classe
                      }`}
                    >
                      {TOM[linha.confianca].rotulo}
                    </span>
                  </div>

                  {linha.estado === 'enviando' && (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0 mt-0.5" />
                  )}
                  {linha.estado === 'ok' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {linha.estado === 'erro' && (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                </div>

                {linha.estado !== 'ok' && (
                  <select
                    value={linha.destinoId}
                    onChange={(e) =>
                      setLinhas((atual) =>
                        atual.map((l, j) => (j === i ? { ...l, destinoId: e.target.value } : l))
                      )
                    }
                    disabled={enviando}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40"
                  >
                    <option value="">Não anexar este arquivo</option>
                    {/* Os prováveis primeiro, mas a lista inteira fica
                        disponível: o palpite pode estar errado. */}
                    {linha.candidatos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                    {pessoas
                      .filter((p) => !linha.candidatos.some((c) => c.id === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                  </select>
                )}

                {linha.erro && <p className="text-red-400 text-xs">{linha.erro}</p>}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={enviar}
            disabled={enviando || prontas.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            Anexar {prontas.length > 0 ? prontas.length : ''}
          </button>
          <button
            onClick={onFechar}
            disabled={enviando}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            Fechar
          </button>
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed">
          O laudo é dado de saúde (art. 11 da LGPD). Fica em armazenamento privado, nunca aparece
          em listagem, e cada abertura fica registrada em auditoria. Anexar substitui o laudo
          anterior da pessoa.
        </p>
      </div>
    </div>
  )
}
