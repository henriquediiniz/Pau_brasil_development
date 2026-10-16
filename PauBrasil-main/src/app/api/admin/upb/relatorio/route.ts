export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin, isUpbAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

function periodoDesde(periodo: string): Date | undefined {
  const now = new Date()
  if (periodo === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (periodo === 'trimestre') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  if (periodo === 'ano') return new Date(now.getFullYear(), 0, 1)
  return undefined
}

export const GET = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isSysAdmin(actor) && !actor.company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const empresaFilter = !isSysAdmin(actor) ? (actor.company as string) : null
  const periodo = req.nextUrl.searchParams.get('periodo') ?? 'mes'
  const desde = periodoDesde(periodo)

  const temporadas = await prisma.uPBTemporada.findMany({
    where: {
      ativo: true,
      ...(empresaFilter ? { empresas: { has: empresaFilter } } : {}),
    },
    include: {
      episodios: { where: { publicado: true }, select: { id: true, duracaoMin: true } },
    },
  })
  const temporadaIds = temporadas.map(t => t.id)
  const episodioIds = temporadas.flatMap(t => t.episodios.map(e => e.id))
  const durPorEpisodio: Record<string, number> = {}
  temporadas.forEach(t => t.episodios.forEach(e => { durPorEpisodio[e.id] = e.duracaoMin }))

  const certificados = await prisma.uPBCertificado.findMany({
    where: {
      temporadaId: { in: temporadaIds },
      ...(desde ? { emitidoEm: { gte: desde } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, photoUrl: true, company: true } },
      temporada: { select: { id: true, titulo: true } },
    },
    orderBy: { emitidoEm: 'desc' },
  })

  const progressos = await prisma.uPBProgresso.findMany({
    where: {
      episodioId: { in: episodioIds },
      concluidoEm: { not: null, ...(desde ? { gte: desde } : {}) },
    },
    select: { userId: true, episodioId: true },
  })

  const tentativas = await prisma.uPBQuizTentativa.findMany({
    where: {
      temporadaId: { in: temporadaIds },
      ...(desde ? { createdAt: { gte: desde } } : {}),
    },
    select: { temporadaId: true, acertos: true, total: true, aprovado: true },
  })

  const matriculas = await prisma.uPBMatricula.findMany({
    where: {
      temporadaId: { in: temporadaIds },
      status: 'APROVADO',
      ...(desde ? { createdAt: { gte: desde } } : {}),
    },
    select: { userId: true, temporadaId: true },
  })

  const alunosUnicos = new Set([
    ...certificados.map(c => c.userId),
    ...progressos.map(p => p.userId),
  ]).size

  const horasAssistidas = progressos.reduce((sum, p) => sum + (durPorEpisodio[p.episodioId] ?? 0), 0) / 60

  const notasAprovadas = tentativas
    .filter(t => t.aprovado)
    .map(t => (t.acertos / t.total) * 100)
  const mediaNotaQuiz = notasAprovadas.length > 0
    ? Math.round(notasAprovadas.reduce((sum, nota) => sum + nota, 0) / notasAprovadas.length)
    : null

  const alunosComProgresso = new Set(progressos.map(p => p.userId)).size
  const taxaConclusao = alunosComProgresso > 0
    ? Math.round((certificados.length / alunosComProgresso) * 100)
    : 0

  const porCurso = temporadas.map(t => {
    const certs = certificados.filter(c => c.temporadaId === t.id)
    const mats = matriculas.filter(m => m.temporadaId === t.id)
    const quiz = tentativas.filter(q => q.temporadaId === t.id && q.aprovado)
    const mediaQuiz = quiz.length > 0
      ? Math.round(quiz.reduce((sum, q) => sum + (q.acertos / q.total) * 100, 0) / quiz.length)
      : null
    const alunosCurso = new Set([...certs.map(c => c.userId), ...mats.map(m => m.userId)]).size

    return {
      id: t.id,
      titulo: t.titulo,
      totalEpisodios: t.episodios.length,
      alunos: alunosCurso,
      certificados: certs.length,
      taxaConclusao: alunosCurso > 0 ? Math.round((certs.length / alunosCurso) * 100) : 0,
      mediaNotaQuiz: mediaQuiz,
    }
  }).sort((a, b) => b.certificados - a.certificados)

  const certsPorUser: Record<string, { name: string; photoUrl: string | null; company: string; total: number }> = {}
  for (const certificado of certificados) {
    if (!certsPorUser[certificado.userId]) {
      certsPorUser[certificado.userId] = {
        name: certificado.user.name ?? '',
        photoUrl: certificado.user.photoUrl ?? null,
        company: certificado.user.company ?? '',
        total: 0,
      }
    }
    certsPorUser[certificado.userId].total++
  }
  const topAlunos = Object.values(certsPorUser).sort((a, b) => b.total - a.total).slice(0, 8)

  const empMap: Record<string, { empresa: string; certificados: number; alunos: Set<string> }> = {}
  for (const certificado of certificados) {
    const empresa = certificado.user.company ?? 'Sem empresa'
    if (!empMap[empresa]) empMap[empresa] = { empresa, certificados: 0, alunos: new Set() }
    empMap[empresa].certificados++
    empMap[empresa].alunos.add(certificado.userId)
  }
  const porEmpresa = Object.values(empMap)
    .map(entry => ({ empresa: entry.empresa, certificados: entry.certificados, alunos: entry.alunos.size }))
    .sort((a, b) => b.certificados - a.certificados)

  const now = new Date()
  const todosOsCerts = await prisma.uPBCertificado.findMany({
    where: { temporadaId: { in: temporadaIds } },
    select: { emitidoEm: true },
  })
  const evolucaoMensal = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    return {
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase()),
      certificados: todosOsCerts.filter(c => c.emitidoEm >= d && c.emitidoEm < fim).length,
    }
  })

  const recentes = certificados.slice(0, 10).map(c => ({
    userName: c.user.name ?? '',
    company: c.user.company ?? '',
    temporadaTitulo: c.temporada.titulo,
    emitidoEm: c.emitidoEm.toISOString(),
  }))

  // ── Matriz de Complexidade Pedagógica ─────────────────────────────────────
  // Top-10 questões com maior taxa de erro na versão atual (versaoAtual por questaoId)
  const respostasQuiz = await prisma.uPBRespostaUsuario.findMany({
    where: { tentativa: { temporadaId: { in: temporadaIds } } },
    select: {
      questaoId: true,
      questaoVersao: true,
      correta: true,
      questao: { select: { enunciado: true, versao: true, temporadaId: true } },
    },
  })

  const questaoMap: Record<string, { questaoId: string; enunciado: string; temporadaId: string; versaoAtual: number; total: number; erros: number }> = {}
  for (const r of respostasQuiz) {
    // Só analisa respostas da versão atual da questão
    if (r.questaoVersao !== r.questao.versao) continue
    if (!questaoMap[r.questaoId]) {
      questaoMap[r.questaoId] = {
        questaoId: r.questaoId,
        enunciado: r.questao.enunciado,
        temporadaId: r.questao.temporadaId,
        versaoAtual: r.questao.versao,
        total: 0,
        erros: 0,
      }
    }
    questaoMap[r.questaoId].total++
    if (!r.correta) questaoMap[r.questaoId].erros++
  }

  const cursoTitulo: Record<string, string> = {}
  temporadas.forEach(t => { cursoTitulo[t.id] = t.titulo })

  const matrizComplexidade = Object.values(questaoMap)
    .filter(q => q.total >= 3) // mínimo de respostas para ser estatisticamente relevante
    .map(q => ({
      questaoId: q.questaoId,
      enunciado: q.enunciado.length > 80 ? q.enunciado.slice(0, 80) + '…' : q.enunciado,
      cursoTitulo: cursoTitulo[q.temporadaId] ?? '',
      versao: q.versaoAtual,
      totalRespostas: q.total,
      taxaErro: Math.round((q.erros / q.total) * 100),
    }))
    .sort((a, b) => b.taxaErro - a.taxaErro)
    .slice(0, 10)

  return NextResponse.json({
    kpis: {
      totalAlunos: alunosUnicos,
      totalCertificados: certificados.length,
      taxaConclusao,
      mediaNotaQuiz,
      horasAssistidas: Math.round(horasAssistidas),
      totalCursos: temporadas.length,
    },
    porCurso,
    topAlunos,
    porEmpresa,
    evolucaoMensal,
    recentes,
    matrizComplexidade,
  })
})
