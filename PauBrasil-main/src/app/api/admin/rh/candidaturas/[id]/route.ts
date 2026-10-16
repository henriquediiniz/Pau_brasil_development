import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { TRANSICOES_VALIDAS } from '@/lib/carreiras-areas'
import { EtapaCandidatura, TipoNotaCandidatura } from '@prisma/client'
import { z } from 'zod'

/*
  Mover para Rejeitado ou Arquivado NAO apaga mais o curriculo.

  Ate 2026-10-01 apagava na hora, no Cloudinary, sem volta. Junto com a regra
  de que dessas etapas nao se saia, isso fazia sentido; quando o PO pediu para
  poder tirar o candidato de la, deixou de fazer: ele voltaria ao funil sem o
  PDF. Dos 71 rejeitados/arquivados naquele dia, 70 ja tinham perdido o CV.

  A exclusao continua existindo, mas como decisao do RH: o botao "Limpar CVs"
  (`/api/admin/rh/cleanup-cvs`) apaga os curriculos de quem esta nessas duas
  etapas, quando o RH quiser.
*/

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  etapa: z.nativeEnum(EtapaCandidatura).optional(),
  nota:  z.string().min(1).max(2000).optional(),
}).refine(d => d.etapa !== undefined || d.nota !== undefined, {
  message: 'Forneça etapa e/ou nota',
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const candidatura = await prisma.candidatura.findUnique({
    where: { id: params.id },
    include: {
      notas: {
        orderBy: { createdAt: 'asc' },
        include: { autor: { select: { id: true, name: true } } },
      },
    },
  })

  if (!candidatura) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(candidatura)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 422 })
  }

  const { etapa: novaEtapa, nota } = parsed.data

  const candidatura = await prisma.candidatura.findUnique({
    where: { id: params.id },
    select: { id: true, etapa: true, nome: true, email: true, cvPublicId: true },
  })
  if (!candidatura) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Validar transição de etapa
  if (novaEtapa && novaEtapa !== candidatura.etapa) {
    const transicoesPermitidas = TRANSICOES_VALIDAS[candidatura.etapa] ?? []
    if (!transicoesPermitidas.includes(novaEtapa)) {
      return NextResponse.json(
        { error: `Transição inválida: ${candidatura.etapa} → ${novaEtapa}` },
        { status: 400 }
      )
    }
  }

  // Atualizar em transação
  const [updated] = await prisma.$transaction(async tx => {
    const ops: Promise<unknown>[] = []

    // Mudar etapa
    let updatedCandidatura = candidatura
    if (novaEtapa && novaEtapa !== candidatura.etapa) {
      updatedCandidatura = await tx.candidatura.update({
        where: { id: params.id },
        data: { etapa: novaEtapa },
        select: { id: true, etapa: true, nome: true, email: true, cvPublicId: true },
      })

      ops.push(
        tx.notaCandidatura.create({
          data: {
            candidaturaId: params.id,
            autorId:       session.user.id,
            texto:         nota ?? `Movido para ${novaEtapa}`,
            tipo:          TipoNotaCandidatura.MUDANCA_ETAPA,
            etapaAnterior: candidatura.etapa,
            etapaNova:     novaEtapa,
          },
        })
      )
    }

    // Nota manual (sem mudança de etapa, ou com)
    if (nota && (!novaEtapa || novaEtapa === candidatura.etapa)) {
      ops.push(
        tx.notaCandidatura.create({
          data: {
            candidaturaId: params.id,
            autorId:       session.user.id,
            texto:         nota,
            tipo:          TipoNotaCandidatura.NOTA,
          },
        })
      )
    }

    await Promise.all(ops)
    return [updatedCandidatura]
  })

  // Audit log — fire-and-forget
  if (novaEtapa && novaEtapa !== candidatura.etapa) {
    audit({
      actorId:    session.user.id,
      actorName:  session.user.name ?? session.user.email ?? '',
      action:     'CANDIDATURA_ETAPA_ALTERADA',
      targetType: 'Candidatura',
      targetId:   params.id,
      meta:       {
        de: candidatura.etapa, para: novaEtapa, nota,
        // Saida de Rejeitado/Arquivado: o caso que precisa ser achavel depois.
        reaberta: candidatura.etapa === 'REJEITADO' || candidatura.etapa === 'ARQUIVADO',
      },
    }).catch(console.error)
  }

  if (nota) {
    audit({
      actorId:    session.user.id,
      actorName:  session.user.name ?? session.user.email ?? '',
      action:     'CANDIDATURA_NOTA_ADICIONADA',
      targetType: 'Candidatura',
      targetId:   params.id,
    }).catch(console.error)
  }

  // Notificar outros RH_ADMIN sobre mudança de etapa
  if (novaEtapa && novaEtapa !== candidatura.etapa) {
    prisma.user.findMany({
      where: { role: 'RH_ADMIN', NOT: { id: session.user.id } },
      select: { id: true },
    }).then(admins =>
      Promise.allSettled(admins.map(u =>
        notify(u.id, `${candidatura.nome}: ${candidatura.etapa} → ${novaEtapa}`, nota)
      ))
    ).catch(console.error)
  }

  return NextResponse.json({ id: params.id, etapa: updated.etapa })
}
