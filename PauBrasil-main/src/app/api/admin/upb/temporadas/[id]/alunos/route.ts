import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isUpbAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'

// GET /api/admin/upb/temporadas/[id]/alunos
// Retorna todos os usuários com qualquer registro na temporada (certificado, progresso ou matrícula)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const temporadaId = params.id

  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: temporadaId },
    select: { id: true, titulo: true, episodios: { select: { id: true } } },
  })
  if (!temporada) return NextResponse.json({ error: 'Temporada não encontrada' }, { status: 404 })

  const episodioIds = temporada.episodios.map(e => e.id)
  const totalEpisodios = episodioIds.length

  // Busca todos os userId distintos com registros na temporada
  const [certificados, matriculas, progressos, tentativas] = await Promise.all([
    prisma.uPBCertificado.findMany({
      where: { temporadaId },
      select: { userId: true, emitidoEm: true, validoAte: true },
    }),
    prisma.uPBMatricula.findMany({
      where: { temporadaId },
      select: { userId: true, status: true, createdAt: true },
    }),
    episodioIds.length > 0
      ? prisma.uPBProgresso.findMany({
          where: { episodioId: { in: episodioIds }, concluidoEm: { not: null } },
          select: { userId: true, episodioId: true },
        })
      : Promise.resolve([]),
    prisma.uPBQuizTentativa.findMany({
      where: { temporadaId },
      select: { userId: true, aprovado: true, createdAt: true },
    }),
  ])

  // Agrupa por userId
  const userMap = new Map<string, {
    certificado: { emitidoEm: Date; validoAte: Date | null } | null
    matricula: { status: string; createdAt: Date } | null
    episodiosConcluidos: number
    tentativas: number
    aprovadoNoQuiz: boolean
  }>()

  for (const c of certificados) {
    const u = userMap.get(c.userId) ?? { certificado: null, matricula: null, episodiosConcluidos: 0, tentativas: 0, aprovadoNoQuiz: false }
    u.certificado = { emitidoEm: c.emitidoEm, validoAte: c.validoAte }
    userMap.set(c.userId, u)
  }
  for (const m of matriculas) {
    const u = userMap.get(m.userId) ?? { certificado: null, matricula: null, episodiosConcluidos: 0, tentativas: 0, aprovadoNoQuiz: false }
    u.matricula = { status: m.status, createdAt: m.createdAt }
    userMap.set(m.userId, u)
  }
  for (const p of progressos) {
    const u = userMap.get(p.userId) ?? { certificado: null, matricula: null, episodiosConcluidos: 0, tentativas: 0, aprovadoNoQuiz: false }
    u.episodiosConcluidos++
    userMap.set(p.userId, u)
  }
  for (const t of tentativas) {
    const u = userMap.get(t.userId) ?? { certificado: null, matricula: null, episodiosConcluidos: 0, tentativas: 0, aprovadoNoQuiz: false }
    u.tentativas++
    if (t.aprovado) u.aprovadoNoQuiz = true
    userMap.set(t.userId, u)
  }

  if (userMap.size === 0) return NextResponse.json({ alunos: [], totalEpisodios })

  // Busca dados dos usuários
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userMap.keys()) } },
    select: { id: true, name: true, email: true },
  })

  const alunos = users.map(u => {
    const d = userMap.get(u.id)!
    const status = d.certificado
      ? 'CERTIFICADO'
      : d.episodiosConcluidos > 0 || d.tentativas > 0
        ? 'EM_ANDAMENTO'
        : 'MATRICULADO'
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      status,
      episodiosConcluidos: d.episodiosConcluidos,
      tentativas: d.tentativas,
      aprovadoNoQuiz: d.aprovadoNoQuiz,
      matriculaStatus: d.matricula?.status ?? null,
      certificadoEm: d.certificado?.emitidoEm ?? null,
      certificadoValidoAte: d.certificado?.validoAte ?? null,
    }
  }).sort((a, b) => {
    const order = { CERTIFICADO: 0, EM_ANDAMENTO: 1, MATRICULADO: 2 }
    return order[a.status as keyof typeof order] - order[b.status as keyof typeof order]
  })

  return NextResponse.json({ alunos, totalEpisodios })
}
