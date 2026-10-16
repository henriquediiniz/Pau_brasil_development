import { criarRotaImportacao } from '@/lib/gente/importar-handler'
import { analisarPlanilhaSucessao, chaveSucessao, type SucessaoImportada } from '@/lib/gente/sucessao'
import { idsColididos } from '@/lib/gente/sobreposicao'

export const dynamic = 'force-dynamic'

export const POST = criarRotaImportacao<
  SucessaoImportada,
  { linha: number; cargo: string; sucessor: string; pronto: string }
>({
  analisar: analisarPlanilhaSucessao,
  /*
    Reimportar **sobrepoe**: o mapeamento de sucessao e revisado a cada ciclo
    de gente e reenviado inteiro. Com `createMany` puro, cada ciclo dobrava a
    lista.

    Nada aponta para `RecSucessao`, entao apagar e recriar nao quebra vinculo.
  */
  gravar: async (tx, registros, _userId, chaves) => {
    const operacaoIds = Array.from(new Set(registros.map((r) => r.operacaoId)))

    const existentes = await tx.recSucessao.findMany({
      where: { operacaoId: { in: operacaoIds } },
      select: { id: true, operacaoId: true, cargoSucessao: true, nomeSucessor: true },
    })

    const substituidos = idsColididos(new Set(chaves), existentes, chaveSucessao)
    if (substituidos.length > 0) {
      await tx.recSucessao.deleteMany({ where: { id: { in: substituidos } } })
    }

    const r = await tx.recSucessao.createMany({ data: registros })
    return r.count
  },
  previa: (s) => ({
    linha: s.linha,
    cargo: s.cargoSucessao,
    sucessor: s.nomeSucessor,
    pronto: s.prontoAgora ? 'agora' : s.pronto1Ano ? '1 ano' : s.pronto2Anos ? '2 anos' : '—',
  }),
  observacao:
    'Quem já estava cadastrado foi substituído pelos dados da planilha — reimportar atualiza, não duplica.',
  acaoAuditoria: 'GENTE_SUCESSAO_IMPORTADA',
  targetType: 'RecSucessao',
})
