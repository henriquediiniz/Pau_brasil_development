import { criarRotaImportacao } from '@/lib/gente/importar-handler'
import { analisarPlanilhaAprendizes, chavePorNome, type AprendizImportado } from '@/lib/gente/pcd-importador'
import { idsColididos } from '@/lib/gente/sobreposicao'

export const dynamic = 'force-dynamic'

export const POST = criarRotaImportacao<
  AprendizImportado,
  { linha: number; nome: string; fundacao: string | null; termino: string | null }
>({
  analisar: analisarPlanilhaAprendizes,
  /*
    Reimportar **sobrepoe**. A planilha de aprendizes e revisada e reenviada, e
    com `createMany` puro a segunda importacao criava copia de todo mundo.

    Apaga-e-recria em vez de `update` um a um: sao duas consultas, nao N. Nada
    aponta para `QuadroAprendiz`, entao trocar o id nao quebra vinculo nenhum.
  */
  gravar: async (tx, registros, _userId, chaves) => {
    const operacaoIds = Array.from(new Set(registros.map((r) => r.operacaoId)))

    const existentes = await tx.quadroAprendiz.findMany({
      where: { operacaoId: { in: operacaoIds } },
      select: { id: true, operacaoId: true, nome: true },
    })

    const substituidos = idsColididos(new Set(chaves), existentes, chavePorNome)
    if (substituidos.length > 0) {
      await tx.quadroAprendiz.deleteMany({ where: { id: { in: substituidos } } })
    }

    const r = await tx.quadroAprendiz.createMany({ data: registros })
    return r.count
  },
  previa: (a) => ({
    linha: a.linha,
    nome: a.nome,
    fundacao: a.fundacao,
    termino: a.terminoContrato ? a.terminoContrato.toISOString().slice(0, 10) : null,
  }),
  acaoAuditoria: 'GENTE_APRENDIZES_IMPORTADOS',
  targetType: 'QuadroAprendiz',
  observacao:
    'Quem já estava cadastrado foi substituído pelos dados da planilha — reimportar atualiza, não duplica. ' +
    'Contratos sem data de término não entram no alerta de vencimento.',
})
