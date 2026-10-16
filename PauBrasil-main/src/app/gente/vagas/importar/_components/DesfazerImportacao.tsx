'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

/**
 * Desfazer uma importação de vagas inteira.
 *
 * Existe porque corrigir uma planilha errada exige apagar o que ela criou
 * antes de reenviar, e fazer isso vaga a vaga em dezenas de linhas não é
 * tarefa que se peça a alguém.
 *
 * O painel mostra o que será apagado — quantas vagas, de quando, de quais
 * operações e com quais cargos — antes de qualquer confirmação. Vaga com
 * candidato vinculado nunca é apagada; o servidor a mantém e devolve a lista
 * do que sobrou.
 */

interface Lote {
  chave: string
  origem: 'carimbado' | 'inferido'
  criadoEm: string
  total: number
  removiveis: number
  bloqueadas: number
  operacoes: string[]
  cargos: string[]
}

const QUANDO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function DesfazerImportacao({ recarregar }: { recarregar: number }) {
  const router = useRouter()
  const [lotes, setLotes] = useState<Lote[] | null>(null)
  const [alvo, setAlvo] = useState<Lote | null>(null)
  const [apagando, setApagando] = useState(false)

  const buscar = useCallback(async () => {
    try {
      const res = await fetch('/api/gente/vagas/importacoes')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setLotes(json.lotes ?? [])
    } catch {
      setLotes([])
    }
  }, [])

  useEffect(() => {
    void buscar()
  }, [buscar, recarregar])

  const desfazer = useCallback(async () => {
    if (!alvo) return
    setApagando(true)
    try {
      const res = await fetch('/api/gente/vagas/importacoes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave: alvo.chave }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Falha ao desfazer')

      toast({
        title: `${json.removidas} vaga(s) excluída(s)`,
        description:
          json.mantidas?.length > 0
            ? `${json.mantidas.length} continuam no sistema por terem candidato vinculado.`
            : 'Pode importar a planilha corrigida.',
        variant: 'success',
      })
      setAlvo(null)
      await buscar()
      router.refresh()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Falha ao desfazer',
        variant: 'destructive',
      })
    } finally {
      setApagando(false)
    }
  }, [alvo, buscar, router])

  // Sem lote nenhum não há o que oferecer, e um painel vazio só ocupa a tela.
  if (lotes !== null && lotes.length === 0) return null

  return (
    <div className="rounded-2xl bg-surface border border-white/10 p-5">
      <div className="flex items-start gap-2.5 mb-1">
        <RotateCcw className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div>
          <h2 className="text-white font-medium text-sm">Desfazer uma importação</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Apaga de uma vez as vagas que entraram por um arquivo, para você reenviar a planilha
            corrigida. Vagas cadastradas na tela e vagas com candidato vinculado não são tocadas.
          </p>
        </div>
      </div>

      {lotes === null ? (
        <div className="flex items-center gap-2 text-slate-500 text-xs py-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Procurando importações…
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {lotes.map((lote) => (
            <li
              key={lote.chave}
              className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-slate-200 text-sm font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  {QUANDO.format(new Date(lote.criadoEm))}
                  <span className="text-slate-500 font-normal">
                    · {lote.total} {lote.total === 1 ? 'vaga' : 'vagas'}
                  </span>
                </div>

                {lote.operacoes.length > 0 && (
                  <p className="text-slate-400 text-xs mt-1 truncate">
                    {lote.operacoes.join(', ')}
                  </p>
                )}

                <p className="text-slate-500 text-xs mt-0.5 truncate">
                  {lote.cargos.join(', ')}
                  {lote.total > lote.cargos.length && ' …'}
                </p>

                {lote.bloqueadas > 0 && (
                  <p className="text-amber-400/80 text-xs mt-1.5">
                    {lote.bloqueadas} com candidato vinculado — {lote.removiveis} serão excluídas.
                  </p>
                )}

                {lote.origem === 'inferido' && (
                  <p className="text-slate-500 text-xs mt-1.5">
                    Importação antiga: reconhecida pelo horário de cadastro. Confira os cargos
                    acima antes de excluir.
                  </p>
                )}
              </div>

              <button
                onClick={() => setAlvo(lote)}
                disabled={lote.removiveis === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={alvo !== null}
        loading={apagando}
        title={`Excluir ${alvo?.removiveis ?? 0} vaga(s)?`}
        description={
          alvo
            ? `Importação de ${QUANDO.format(new Date(alvo.criadoEm))}` +
              (alvo.operacoes.length > 0 ? ` — ${alvo.operacoes.join(', ')}` : '') +
              '. Não dá para voltar atrás: para recuperá-las é preciso importar a planilha de novo.' +
              (alvo.bloqueadas > 0
                ? ` ${alvo.bloqueadas} vaga(s) com candidato vinculado continuam no sistema.`
                : '')
            : undefined
        }
        confirmLabel="Excluir vagas"
        onConfirm={desfazer}
        onCancel={() => setAlvo(null)}
      />
    </div>
  )
}
