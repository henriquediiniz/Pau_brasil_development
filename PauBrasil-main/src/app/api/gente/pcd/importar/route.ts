import { criarRotaImportacao } from '@/lib/gente/importar-handler'
import { analisarPlanilhaPcd, chavePorNome, type PcdImportado } from '@/lib/gente/pcd-importador'
import { parearPorChave } from '@/lib/gente/sobreposicao'

export const dynamic = 'force-dynamic'

export const POST = criarRotaImportacao<PcdImportado, { linha: number; nome: string; funcao: string | null; deficiencia: string | null }>({
  analisar: analisarPlanilhaPcd,
  /*
    Reimportar **sobrepoe**, e aqui a sobreposicao nao pode apagar.

    O laudo e anexado registro a registro, fora da planilha. Se a reimportacao
    apagasse a linha e criasse outra, o `laudoBlobKey` ia junto: o arquivo
    ficaria orfao no armazenamento e o RH teria que reanexar laudo por laudo,
    sem nem saber de quem. Dado de saude que se perde assim nao volta da
    planilha.

    Entao quem ja existe e **atualizado** — os campos do laudo nem sao tocados
    — e so quem e novo entra por `createMany`. Os updates sao sequenciais, e e
    por isso que a transacao da fabrica roda com folga alem dos 5 s padrao.
  */
  gravar: async (tx, registros, _userId, chaves) => {
    const operacaoIds = Array.from(new Set(registros.map((r) => r.operacaoId)))

    const existentes = await tx.quadroPcd.findMany({
      where: { operacaoId: { in: operacaoIds } },
      select: { id: true, operacaoId: true, nome: true },
    })

    const { atualizar, criar } = parearPorChave(
      registros,
      (_r, i) => chaves[i],
      existentes,
      chavePorNome
    )

    for (const { antigo, novo } of atualizar) {
      await tx.quadroPcd.update({ where: { id: antigo.id }, data: novo })
    }

    const criados = criar.length > 0 ? (await tx.quadroPcd.createMany({ data: criar })).count : 0

    // Atualizado tambem e "gravado": o RH conta as linhas da planilha.
    return criados + atualizar.length
  },
  previa: (p) => ({ linha: p.linha, nome: p.nome, funcao: p.funcao, deficiencia: p.deficiencia }),
  acaoAuditoria: 'GENTE_PCD_IMPORTADOS',
  targetType: 'QuadroPcd',
  observacao:
    'Quem já estava cadastrado foi atualizado pelos dados da planilha — reimportar não duplica, e o laudo já anexado é preservado. ' +
    'Os laudos não vêm pela planilha: anexe cada um pelo cadastro da pessoa.',
})
