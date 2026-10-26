import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from '@/lib/zod'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import {
  VALORES_ESCOLARIDADE, VALORES_GENERO, IDADE_MAXIMA, IDADE_MINIMA,
  idadeAceita, lerDataNascimento,
} from '@/lib/carreiras-perfil'

export const dynamic = 'force-dynamic'

/**
 * RH completa ou corrige o perfil de triagem de uma candidatura.
 *
 * Existe porque o Banco de Talentos ja tinha ~300 candidaturas quando o perfil
 * passou a ser perguntado, e porque os CVs importados em massa pelo RH nao
 * passam pelo formulario. Sem isto, essas pessoas ficariam para sempre fora
 * dos filtros de genero, idade e escolaridade.
 *
 * `null` apaga o campo — o RH pode ter preenchido errado.
 */
const PerfilSchema = z.object({
  genero:         z.enum(VALORES_GENERO).nullable().optional(),
  dataNascimento: z.string()
    .refine((s) => lerDataNascimento(s) !== null, 'Data de nascimento inválida')
    .refine((s) => { const d = lerDataNascimento(s); return !d || idadeAceita(d) },
      `Idade deve estar entre ${IDADE_MINIMA} e ${IDADE_MAXIMA} anos`)
    .nullable()
    .optional(),
  escolaridade:   z.enum(VALORES_ESCOLARIDADE).nullable().optional(),
})

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const parsed = PerfilSchema.safeParse(body)
  if (!parsed.success) {
    const primeiro = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return NextResponse.json({ error: primeiro ?? 'Dados inválidos' }, { status: 422 })
  }

  const existe = await prisma.candidatura.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!existe) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const { genero, dataNascimento, escolaridade } = parsed.data
  const atualizado = await prisma.candidatura.update({
    where: { id: params.id },
    data: {
      ...(genero !== undefined ? { genero } : {}),
      ...(escolaridade !== undefined ? { escolaridade } : {}),
      ...(dataNascimento !== undefined
        ? { dataNascimento: dataNascimento === null ? null : lerDataNascimento(dataNascimento) }
        : {}),
    },
    select: { id: true, genero: true, dataNascimento: true, escolaridade: true },
  })

  // Registra QUAIS campos mudaram, nao os valores: o log de auditoria e lido
  // por mais gente que a ficha do candidato.
  audit({
    actorId:    session.user.id,
    actorName:  session.user.name ?? session.user.email ?? '',
    action:     'CANDIDATURA_PERFIL_ATUALIZADO',
    targetType: 'Candidatura',
    targetId:   params.id,
    meta:       { campos: Object.keys(parsed.data) },
  }).catch(console.error)

  return NextResponse.json(atualizado)
}
