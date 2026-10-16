'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, ArrowRight, CheckCircle2, Download, FileSpreadsheet, Loader2, XCircle,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import type { TipoModelo } from '@/lib/gente/modelos'
import { localizarTabela, montarLinhas, prepararParaEnvio } from '@/lib/gente/planilha-leitura'

/**
 * Tela de importação de planilha, compartilhada pelo módulo Gente.
 *
 * O fluxo é sempre o mesmo — escolher, conferir o dry-run, confirmar — e só
 * muda o endpoint e como cada prévia é mostrada. A conferência antes de gravar
 * não é opcional: é o que impede planilha suja de virar base suja.
 */

export interface ProblemaImportacao {
  linha: number
  campo?: string
  mensagem: string
  valor?: string
}

export interface ResumoImportacao {
  total: number
  validos?: number
  validas?: number
  comErro: number
  avisos: number
  duplicados?: number
  duplicadas?: number
  criados?: number
  criadas?: number
}

interface RespostaDryRun<P> {
  dryRun: boolean
  resumo: ResumoImportacao
  previa: P[]
  erros: ProblemaImportacao[]
  avisos: ProblemaImportacao[]
  duplicados?: ProblemaImportacao[]
  duplicadas?: ProblemaImportacao[]
}

type Etapa = 'escolher' | 'lendo' | 'conferir' | 'gravando' | 'concluido'

interface Props<P> {
  endpoint: string
  /** Para onde voltar depois de importar. */
  destino: string
  /** Qual planilha-modelo oferecer para download. */
  tipoModelo: TipoModelo
  /** Singular e plural do que está sendo importado ("vaga" / "vagas"). */
  substantivo: { singular: string; plural: string }
  /** Itens do bloco "o que a planilha precisa ter". */
  requisitos: React.ReactNode
  renderPrevia: (item: P) => React.ReactNode
  /** Mostrado depois de concluir, quando houver regra a explicar. */
  observacaoFinal?: string
  /** Avisa a tela que algo foi gravado, para ela recarregar o que depende disso. */
  onConcluido?: () => void
}

export function ImportadorPlanilha<P extends { linha: number }>({
  endpoint,
  destino,
  tipoModelo,
  substantivo,
  requisitos,
  renderPrevia,
  observacaoFinal,
  onConcluido,
}: Props<P>) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [linhas, setLinhas] = useState<{ linha: number; dados: Record<string, unknown> }[]>([])
  const [analise, setAnalise] = useState<RespostaDryRun<P> | null>(null)
  const [erroGeral, setErroGeral] = useState('')
  const [resultado, setResultado] = useState<ResumoImportacao | null>(null)
  const [baixandoModelo, setBaixandoModelo] = useState(false)

  /** Onde a tabela foi encontrada — mostrado para a pessoa conferir. */
  const [ondeAchou, setOndeAchou] = useState<{
    aba: string
    linha: number
    colunas: number
    abas: number
  } | null>(null)

  /**
   * O modelo vem do servidor porque traz as operações que este usuário pode
   * gravar — unidade não reconhecida é o erro que mais bloqueia importação.
   */
  const baixarModelo = useCallback(async () => {
    setBaixandoModelo(true)
    try {
      const res = await fetch(`/api/gente/modelo?tipo=${tipoModelo}`)
      if (!res.ok) throw new Error('Falha ao gerar o modelo')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `modelo-${tipoModelo}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Não foi possível baixar o modelo', variant: 'destructive' })
    } finally {
      setBaixandoModelo(false)
    }
  }, [tipoModelo])

  // Os endpoints usam género diferente no resumo (validos/validas). Normaliza.
  const validos = (r: ResumoImportacao) => r.validos ?? r.validas ?? 0
  const duplicados = (r: RespostaDryRun<P>) => r.duplicados ?? r.duplicadas ?? []
  const criados = (r: ResumoImportacao) => r.criados ?? r.criadas ?? 0

  const reiniciar = () => {
    setEtapa('escolher')
    setNomeArquivo('')
    setLinhas([])
    setAnalise(null)
    setErroGeral('')
    setResultado(null)
    setOndeAchou(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const aoEscolherArquivo = useCallback(
    async (file: File) => {
      setErroGeral('')
      setNomeArquivo(file.name)
      setEtapa('lendo')

      try {
        // Carregado sob demanda: não pesa a primeira carga da tela.
        const XLSX = await import('xlsx')
        const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true })
        if (wb.SheetNames.length === 0) throw new Error('A planilha não tem nenhuma aba')

        // `raw: true` é essencial: com `raw: false` a data sai formatada pelo
        // formato da própria célula, e a planilha do RH usa mês/dia/ano —
        // "9/5/24" seria lido como 9 de maio em vez de 5 de setembro. Com
        // `raw: true` a data chega como Date e não há o que interpretar.
        const abas = wb.SheetNames.map((nome) => ({
          nome,
          matriz: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nome], {
            header: 1,
            defval: null,
            raw: true,
            blankrows: true,
          }),
        }))

        // A tabela não está necessariamente na primeira aba nem na primeira
        // linha: a planilha do ciclo de gente tem capa, resumo e a tabela
        // começando na linha 6.
        const tabela = localizarTabela(abas, tipoModelo)
        if (!tabela) {
          throw new Error(
            'Não encontrei uma tabela reconhecível neste arquivo. Confira se os cabeçalhos estão como no modelo — baixe o modelo para comparar.'
          )
        }

        const abaEscolhida = abas.find((a) => a.nome === tabela.aba)!

        // O `!ref` da aba pode começar abaixo da linha 1; a matriz é relativa a
        // ele, então o número que o usuário vê no Excel precisa desse ajuste.
        const ref = wb.Sheets[tabela.aba]['!ref']
        const primeiraLinha = ref ? XLSX.utils.decode_range(ref).s.r + 1 : 1

        const lidas = prepararParaEnvio(
          montarLinhas(abaEscolhida.matriz, tabela.indiceCabecalho, primeiraLinha)
        )
        if (lidas.length === 0) {
          throw new Error(`A aba "${tabela.aba}" não tem linhas de dados abaixo do cabeçalho`)
        }

        setOndeAchou({
          aba: tabela.aba,
          linha: primeiraLinha + tabela.indiceCabecalho,
          colunas: tabela.reconhecidos,
          abas: wb.SheetNames.length,
        })
        setLinhas(lidas)

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linhas: lidas }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Falha ao analisar a planilha')

        setAnalise(json as RespostaDryRun<P>)
        setEtapa('conferir')
      } catch (err) {
        setErroGeral(err instanceof Error ? err.message : 'Não foi possível ler o arquivo')
        setEtapa('escolher')
      }
    },
    [endpoint, tipoModelo]
  )

  const confirmar = useCallback(async () => {
    setEtapa('gravando')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linhas, confirmar: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Falha ao importar')

      setResultado(json.resumo)
      setEtapa('concluido')
      onConcluido?.()
      toast({
        title: `${criados(json.resumo)} ${substantivo.plural} importados`,
        variant: 'success',
      })
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Falha ao importar')
      setEtapa('conferir')
    }
  }, [endpoint, linhas, substantivo.plural, onConcluido])

  return (
    <div className="space-y-5">
      {erroGeral && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{erroGeral}</p>
        </div>
      )}

      {etapa === 'escolher' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20">
            <div className="min-w-0">
              <p className="text-white text-sm font-medium">Não tem a planilha no formato certo?</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Baixe o modelo — ele já vem com os cabeçalhos aceitos, uma linha de exemplo e a
                lista das unidades que você pode usar.
              </p>
            </div>
            <button
              onClick={baixarModelo}
              disabled={baixandoModelo}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/20 disabled:opacity-40 transition-colors shrink-0"
            >
              {baixandoModelo ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Baixar modelo
            </button>
          </div>

          <label
            htmlFor="planilha"
            className="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl bg-white/3 border border-dashed border-white/15 hover:border-brand-500/40 hover:bg-brand-500/5 cursor-pointer transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-brand-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Escolher planilha</p>
              <p className="text-slate-500 text-xs mt-0.5">Excel (.xlsx, .xls) ou CSV</p>
            </div>
          </label>
          <input
            ref={inputRef}
            id="planilha"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) aoEscolherArquivo(f)
            }}
          />

          <div className="mt-4 p-4 rounded-2xl bg-white/3 border border-white/8">
            <p className="text-slate-300 text-xs font-medium mb-2">O que a planilha precisa ter</p>
            <ul className="text-slate-500 text-xs space-y-1 leading-relaxed">{requisitos}</ul>
          </div>
        </div>
      )}

      {etapa === 'lendo' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          <p className="text-slate-400 text-sm">Lendo e conferindo {nomeArquivo}…</p>
        </div>
      )}

      {etapa === 'conferir' && analise && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {nomeArquivo}
            <button onClick={reiniciar} className="text-slate-500 hover:text-slate-300 underline">
              trocar
            </button>
          </div>

          {/*
            Como a tabela é localizada automaticamente, a pessoa precisa poder
            conferir se o sistema achou a aba certa antes de confirmar.
          */}
          {ondeAchou && (
            <p className="text-slate-500 text-xs">
              Tabela encontrada na aba{' '}
              <span className="text-slate-300">“{ondeAchou.aba}”</span>, com o cabeçalho na linha{' '}
              <span className="text-slate-300 tabular-nums">{ondeAchou.linha}</span> e{' '}
              {ondeAchou.colunas} coluna{ondeAchou.colunas === 1 ? '' : 's'} reconhecida
              {ondeAchou.colunas === 1 ? '' : 's'}.
              {ondeAchou.abas > 1 && ` O arquivo tem ${ondeAchou.abas} abas; as outras foram ignoradas.`}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Cartao rotulo="Linhas lidas" valor={analise.resumo.total} />
            <Cartao rotulo="Prontos" valor={validos(analise.resumo)} tom="ok" />
            <Cartao
              rotulo="Com erro"
              valor={analise.resumo.comErro}
              tom={analise.resumo.comErro ? 'erro' : undefined}
            />
            <Cartao
              rotulo="Repetidos"
              valor={duplicados(analise).length}
              tom={duplicados(analise).length ? 'aviso' : undefined}
            />
          </div>

          {analise.erros.length > 0 && (
            <ListaProblemas
              titulo={`${analise.resumo.comErro} linha(s) não serão importadas`}
              descricao="Corrija na planilha e envie de novo. As demais podem ser importadas agora."
              itens={analise.erros}
              tom="erro"
            />
          )}

          {duplicados(analise).length > 0 && (
            <ListaProblemas
              titulo={`${duplicados(analise).length} linha(s) repetidas no arquivo`}
              descricao="Só a primeira ocorrência será importada."
              itens={duplicados(analise)}
              tom="aviso"
            />
          )}

          {analise.avisos.length > 0 && (
            <ListaProblemas
              titulo={`${analise.avisos.length} ponto(s) de atenção`}
              descricao="Não impedem a importação, mas vale conferir antes de confirmar."
              itens={analise.avisos}
              tom="aviso"
            />
          )}

          {analise.previa.length > 0 && (
            <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/8">
                <p className="text-slate-300 text-xs font-medium">
                  Prévia — primeiros {analise.previa.length} de {validos(analise.resumo)}
                </p>
              </div>
              <div className="divide-y divide-white/5">
                {analise.previa.map((item) => (
                  <div key={item.linha} className="flex items-center gap-3 px-4 py-2 text-xs">
                    <span className="text-slate-600 tabular-nums w-10 shrink-0">L{item.linha}</span>
                    {renderPrevia(item)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={confirmar}
              disabled={validos(analise.resumo) === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Importar {validos(analise.resumo)}{' '}
              {validos(analise.resumo) === 1 ? substantivo.singular : substantivo.plural}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={reiniciar}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
            >
              Cancelar
            </button>
          </div>

          {validos(analise.resumo) === 0 && (
            <p className="text-slate-500 text-xs">
              Nenhuma linha está pronta. Corrija os erros acima e envie a planilha de novo.
            </p>
          )}
        </div>
      )}

      {etapa === 'gravando' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          <p className="text-slate-400 text-sm">Importando…</p>
        </div>
      )}

      {etapa === 'concluido' && resultado && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-medium">
              {criados(resultado)}{' '}
              {criados(resultado) === 1 ? substantivo.singular : substantivo.plural} importados
            </p>
            {resultado.comErro > 0 && (
              <p className="text-slate-500 text-sm mt-1">
                {resultado.comErro} linha(s) ficaram de fora e podem ser reenviadas depois de
                corrigidas.
              </p>
            )}
            {observacaoFinal && (
              <p className="text-slate-400 text-xs mt-2 max-w-md">{observacaoFinal}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(destino)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/20 transition-colors"
            >
              Ver a lista
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={reiniciar}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
            >
              Importar outra planilha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Peças ────────────────────────────────────────────────────────────────────

function Cartao({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string
  valor: number
  tom?: 'ok' | 'erro' | 'aviso'
}) {
  const cor =
    tom === 'ok' ? 'text-emerald-400'
    : tom === 'erro' ? 'text-red-400'
    : tom === 'aviso' ? 'text-amber-400'
    : 'text-white'

  return (
    <div className="p-3 rounded-2xl bg-white/3 border border-white/8">
      <div className={`text-xl font-display font-bold tabular-nums ${cor}`}>{valor}</div>
      <div className="text-slate-500 text-[11px] mt-0.5">{rotulo}</div>
    </div>
  )
}

function ListaProblemas({
  titulo,
  descricao,
  itens,
  tom,
}: {
  titulo: string
  descricao: string
  itens: ProblemaImportacao[]
  tom: 'erro' | 'aviso'
}) {
  const [aberto, setAberto] = useState(tom === 'erro')

  const borda = tom === 'erro' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'
  const corTitulo = tom === 'erro' ? 'text-red-400' : 'text-amber-400'
  const Icone = tom === 'erro' ? XCircle : AlertTriangle

  return (
    <div className={`rounded-2xl border ${borda} overflow-hidden`}>
      <button
        onClick={() => setAberto((a) => !a)}
        className="w-full flex items-start gap-3 p-4 text-left"
        aria-expanded={aberto}
      >
        <Icone className={`w-4 h-4 shrink-0 mt-0.5 ${corTitulo}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${corTitulo}`}>{titulo}</p>
          <p className="text-slate-400 text-xs mt-0.5">{descricao}</p>
        </div>
        <span className="text-slate-500 text-xs shrink-0">{aberto ? 'ocultar' : 'ver'}</span>
      </button>

      {aberto && (
        <div className="max-h-64 overflow-y-auto border-t border-white/5 divide-y divide-white/5">
          {itens.map((p, i) => (
            <div key={`${p.linha}-${p.campo}-${i}`} className="flex items-start gap-3 px-4 py-2 text-xs">
              <span className="text-slate-600 tabular-nums w-10 shrink-0">L{p.linha}</span>
              <div className="flex-1">
                <span className="text-slate-300">{p.mensagem}</span>
                {p.valor && <span className="text-slate-500"> — recebido: “{p.valor}”</span>}
              </div>
              {p.campo && <span className="text-slate-600 shrink-0">{p.campo}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
