import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente } from '@/lib/gente/api'
import { resolverEscopoGente } from '@/lib/gente/scope'
import { MODELOS, ehTipoModelo, linhaExemplo } from '@/lib/gente/modelos'

export const dynamic = 'force-dynamic'

/**
 * Gera a planilha-modelo de um importador.
 *
 * É feita no servidor, e não no navegador, por um motivo: a aba "Operações"
 * precisa trazer as unidades que **aquele usuário** pode gravar. Unidade que
 * o sistema não reconhece é o erro que mais bloqueia importação, e o modelo
 * resolve isso entregando a lista pronta para copiar.
 */
export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const tipo = req.nextUrl.searchParams.get('tipo')
  if (!ehTipoModelo(tipo)) {
    return NextResponse.json(
      { error: 'Modelo não encontrado', tipos: Object.keys(MODELOS) },
      { status: 400 }
    )
  }

  const modelo = MODELOS[tipo]
  const escopo = resolverEscopoGente(user)

  const operacoes =
    escopo.tipo === 'nenhuma'
      ? []
      : await prisma.operacao.findMany({
          where: {
            ativo: true,
            ...(escopo.tipo === 'operacoes'
              ? {
                  id: { in: escopo.operacaoIds },
                  ...(escopo.empresaId ? { empresaId: escopo.empresaId } : {}),
                }
              : {}),
          },
          orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
          select: { nome: true, nomeAbrev: true },
        })

  const wb = XLSX.utils.book_new()

  // ── Aba 1: a planilha em si, com cabeçalhos e uma linha de exemplo ──
  const cabecalhos = modelo.colunas.map((c) => c.titulo)
  const exemplo = linhaExemplo(modelo)

  const abaDados = XLSX.utils.json_to_sheet([exemplo], { header: cabecalhos })
  // Largura das colunas pela maior string entre cabeçalho e exemplo.
  abaDados['!cols'] = modelo.colunas.map((c) => ({
    wch: Math.min(40, Math.max(c.titulo.length, c.exemplo.length, 10) + 2),
  }))
  XLSX.utils.book_append_sheet(wb, abaDados, 'Dados')

  // ── Aba 2: o que cada coluna espera ──
  const instrucoes = [
    { Coluna: '⚠ APAGUE A LINHA DE EXEMPLO', Obrigatória: '', 'O que preencher': 'A aba "Dados" traz uma linha de exemplo só para mostrar o formato. Apague antes de importar os seus dados.' },
    { Coluna: '', Obrigatória: '', 'O que preencher': '' },
    ...modelo.colunas.map((c) => ({
      Coluna: c.titulo,
      Obrigatória: c.obrigatoria ? 'Sim' : 'Não',
      'O que preencher': c.regra ?? '',
    })),
    { Coluna: '', Obrigatória: '', 'O que preencher': '' },
    {
      Coluna: 'Colunas a mais',
      Obrigatória: '',
      'O que preencher': 'São ignoradas — pode deixar colunas extras da sua planilha.',
    },
    {
      Coluna: 'Conferência',
      Obrigatória: '',
      'O que preencher': 'Ao enviar, o sistema mostra erros e avisos ANTES de gravar. Nada entra sem você confirmar.',
    },
  ]

  const abaInstrucoes = XLSX.utils.json_to_sheet(instrucoes)
  abaInstrucoes['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 95 }]
  XLSX.utils.book_append_sheet(wb, abaInstrucoes, 'Instruções')

  // ── Aba 3: as unidades que este usuário pode usar ──
  const abaOperacoes = XLSX.utils.json_to_sheet(
    operacoes.length > 0
      ? operacoes.map((o) => ({
          'Escreva assim na coluna Unidade': o.nome,
          'Também aceito': o.nomeAbrev ?? '',
        }))
      : [
          {
            'Escreva assim na coluna Unidade':
              'Nenhuma operação atribuída ao seu usuário — peça ao administrador.',
            'Também aceito': '',
          },
        ]
  )
  abaOperacoes['!cols'] = [{ wch: 45 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, abaOperacoes, 'Operações')

  // `XLSX.write` devolve um Buffer do Node. O `BodyInit` tipado desta versão
  // não aceita Buffer nem Uint8Array direto, então embrulhamos num Blob — que
  // é BodyInit válido e não copia os bytes duas vezes.
  const buffer: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const corpo = new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  return new NextResponse(corpo, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${modelo.nomeArquivo}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
})
