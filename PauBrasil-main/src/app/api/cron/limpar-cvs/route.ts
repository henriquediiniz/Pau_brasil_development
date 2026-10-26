import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { apagarPrivado } from '@/lib/armazenamento'
import { limparTentativasVencidas } from '@/lib/limite-tentativas'
import {
  DIAS_RETENCAO_CV, ETAPAS_DE_SAIDA, cvVencido, saidaDoFunil,
} from '@/lib/carreiras-retencao'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * GET /api/cron/limpar-cvs — Vercel Cron, diariamente.
 *
 * Apaga o curriculo de quem esta em Rejeitado/Arquivado ha 10 dias ou mais
 * (ver `carreiras-retencao.ts`). O prazo conta da saida do funil, lida no
 * historico de etapas; quem foi reaberto antes disso nao entra aqui.
 *
 * Diferente dos outros crons, **recusa quando `CRON_SECRET` nao esta
 * configurado**: esta rota apaga arquivo sem volta, e aberta ela deixaria
 * qualquer um disparar a limpeza.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/limpar-cvs] CRON_SECRET ausente — limpeza nao executada')
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Aproveita a passada diária para apagar os contadores de tentativa vencidos
  await limparTentativasVencidas().catch((error) => console.error('[cron/limpar-cvs] tentativas', error))

  const hoje = new Date()

  const candidatas = await prisma.candidatura.findMany({
    where: {
      etapa: { in: [...ETAPAS_DE_SAIDA] },
      cvPublicId: { not: null },
    },
    select: {
      id: true,
      cvPublicId: true,
      updatedAt: true,
      notas: {
        where: { tipo: 'MUDANCA_ETAPA' },
        select: { etapaAnterior: true, etapaNova: true, createdAt: true },
      },
    },
  })

  const vencidas = candidatas.filter((c) => cvVencido(saidaDoFunil(c.notas, c.updatedAt), hoje))

  if (vencidas.length === 0) {
    return NextResponse.json({ deleted: 0, analisadas: candidatas.length })
  }

  /*
    Zera a referencia no banco antes de apagar no armazenamento, como o botao
    "Limpar CVs": se o Blob falhar, sobra um arquivo orfao, e nao um
    cadastro apontando para um PDF que nao abre.

    O `etapa: { in }` de novo no update fecha a corrida com o RH: se alguem
    reabriu o candidato entre a leitura e aqui, ele nao perde o curriculo.
  */
  const ids = vencidas.map((c) => c.id)
  await prisma.candidatura.updateMany({
    where: { id: { in: ids }, etapa: { in: [...ETAPAS_DE_SAIDA] } },
    data: { cvUrl: null, cvPublicId: null },
  })

  const aindaFora = await prisma.candidatura.findMany({
    where: { id: { in: ids }, cvPublicId: null },
    select: { id: true },
  })
  const apagar = new Set(aindaFora.map((c) => c.id))
  const publicIds = vencidas.filter((c) => apagar.has(c.id)).map((c) => c.cvPublicId as string)

  const resultados = await Promise.allSettled(publicIds.map((id) => apagarPrivado(id)))
  const falhas = resultados.filter((r) => r.status === 'rejected').length

  await audit({
    actorId:    'cron',
    actorName:  'Limpeza automática de currículos',
    action:     'CANDIDATURA_CVS_LIMPOS',
    targetType: 'Candidatura',
    meta:       { automatico: true, dias: DIAS_RETENCAO_CV, total: publicIds.length, falhasArmazenamento: falhas, ids: Array.from(apagar) },
  }).catch(console.error)

  return NextResponse.json({ deleted: publicIds.length, falhasArmazenamento: falhas, analisadas: candidatas.length })
}
