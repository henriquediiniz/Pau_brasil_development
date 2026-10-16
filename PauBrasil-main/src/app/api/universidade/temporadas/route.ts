import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { canAccessUpbAudience, getUpbEnrollmentStatus } from '@/lib/upb-access'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actor = await getEffectiveSessionUser(session.user)
  const userId = actor.id
  const userCompany = actor.company
  const userUnits = actor.units ?? []
  const userFunctionId = actor.functionId

  const now = new Date()

  const allTemporadas = await prisma.uPBTemporada.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      capa: true,
      ordem: true,
      restricaoAcesso: true,
      empresas: true,
      unidades: true,
      funcoesComAcesso: true,
      episodios: {
        where: { publicado: true },
        select: {
          progressos: {
            where: { userId },
            select: { concluidoEm: true },
          },
        },
      },
      certificados: { where: { userId } },
      matriculas: {
        where: { userId },
        select: { status: true },
      },
      _count: { select: { questoes: true } },
      obrigatorios: {
        where: {
          ativo: true,
          prazo: { gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30) },
        },
        select: {
          prazo: true,
          empresas: true,
          unidades: true,
          funcoes: true,
        },
      },
    },
  })

  // Filter by empresa: show if empresas is empty (global) or includes user's company
  // Filter by unidade: show if unidades is empty (global) or intersects with user's units
  const temporadas = allTemporadas.filter((t) => canAccessUpbAudience(actor, t))

  const result = temporadas.map((t) => {
    const total = t.episodios.length
    const concluidos = t.episodios.filter((e) => e.progressos.length > 0 && e.progressos[0].concluidoEm !== null).length
    const rawMatricula = t.matriculas[0] ?? null
    const matriculaStatus = getUpbEnrollmentStatus(actor, t, rawMatricula?.status ?? null)

    // Find the most urgent active obrigatorio that applies to this user
    const obrigatorioAtivo = t.obrigatorios
      .filter((o) => {
        const empresaOk = o.empresas.length === 0 || (userCompany && o.empresas.includes(userCompany))
        const unidadeOk = o.unidades.length === 0 || userUnits.some((u) => o.unidades.includes(u))
        // funcoes vazio = todos da empresa; caso contrário, só se o user tem aquela função
        const funcaoOk = o.funcoes.length === 0 || (userFunctionId && o.funcoes.includes(userFunctionId))
        return empresaOk && unidadeOk && funcaoOk
      })
      .sort((a, b) => a.prazo.getTime() - b.prazo.getTime())[0] ?? null

    return {
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      capa: t.capa,
      ordem: t.ordem,
      restricaoAcesso: t.restricaoAcesso,
      totalEpisodios: total,
      concluidos,
      temProva: t._count.questoes > 0,
      matriculaStatus,
      certificado: t.certificados.length > 0 ? t.certificados[0] : null,
      empresas: t.empresas,
      unidades: t.unidades,
      obrigatorio: obrigatorioAtivo ? { prazo: obrigatorioAtivo.prazo.toISOString() } : null,
    }
  })

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  })
}
