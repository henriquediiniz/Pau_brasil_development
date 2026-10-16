import { criarRotaImportacao } from '@/lib/gente/importar-handler'
import { analisarPlanilhaInternos, type InternoImportado } from '@/lib/gente/sucessao'
import { normalizar } from '@/lib/gente/vaga-importador'

export const dynamic = 'force-dynamic'

export const POST = criarRotaImportacao<
  InternoImportado,
  { linha: number; nome: string; cargoAtual: string | null; cargoPretendido: string | null }
>({
  analisar: analisarPlanilhaInternos,
  /*
    Reimportar **sobrepoe**, nao duplica.

    A planilha de candidatos internos e revisada e reenviada — o RH acrescenta
    uma pessoa e manda de novo. Com `createMany` puro, a segunda importacao
    criava copias de todo mundo e o modulo passava a mostrar a mesma pessoa
    duas vezes, com dados possivelmente divergentes.

    A identidade e a mesma que o analisador usa dentro do arquivo: operacao +
    nome normalizado. Nao ha matricula na planilha.

    Apaga-e-recria em vez de `update` um a um: sao duas consultas, nao N, e a
    transacao da fabrica e interativa (limite de 5s). Com dezenas de linhas, os
    updates sequenciais estourariam — foi o que derrubou a importacao de cargos
    com P2028. O id do registro muda, e nada aponta para ele.
  */
  gravar: async (tx, registros) => {
    const chave = (operacaoId: string | null, nome: string) =>
      `${operacaoId ?? ''}|${normalizar(nome)}`

    const operacaoIds = Array.from(
      new Set(registros.map((r) => r.operacaoId).filter((id): id is string => Boolean(id)))
    )

    const existentes = await tx.recCandidatoInterno.findMany({
      where: { operacaoId: { in: operacaoIds } },
      select: { id: true, operacaoId: true, nome: true },
    })

    const chegando = new Set(registros.map((r) => chave(r.operacaoId, r.nome)))
    const substituidos = existentes
      .filter((e) => chegando.has(chave(e.operacaoId, e.nome)))
      .map((e) => e.id)

    if (substituidos.length > 0) {
      await tx.recCandidatoInterno.deleteMany({ where: { id: { in: substituidos } } })
    }

    const r = await tx.recCandidatoInterno.createMany({ data: registros })
    return r.count
  },
  observacao:
    'Quem já estava cadastrado foi substituído pelos dados da planilha — reimportar atualiza, não duplica.',
  previa: (i) => ({
    linha: i.linha,
    nome: i.nome,
    cargoAtual: i.cargoAtual,
    cargoPretendido: i.cargoPretendido,
  }),
  acaoAuditoria: 'GENTE_INTERNOS_IMPORTADOS',
  targetType: 'RecCandidatoInterno',
})
