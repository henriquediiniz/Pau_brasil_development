import { NextRequest, NextResponse } from 'next/server'
import { z } from '@/lib/zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { sendEmail, emailContatoRecebido } from '@/lib/email'

const schema = z.object({
  nome:     z.string().min(2).max(100),
  email:    z.string().email(),
  assunto:  z.enum(['Candidatura', 'Parceria', 'Imprensa', 'Outro']),
  mensagem: z.string().min(10).max(2000),
})

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    // Texto, não objeto: a tela exibe `error` direto
    const campo = parsed.error.issues[0]
    const nomes: Record<string, string> = { nome: 'Nome', email: 'E-mail', assunto: 'Assunto', mensagem: 'Mensagem' }
    return NextResponse.json(
      { error: `${nomes[String(campo?.path[0])] ?? 'Dados'}: ${campo?.message ?? 'inválido'}` },
      { status: 400 },
    )
  }

  const ip = getIp(req)
  const umHoraAtras = new Date(Date.now() - 60 * 60 * 1000)

  // Rate-limit: máx 3 envios por IP por hora
  const recentes = await prisma.auditLog.count({
    where: {
      action: 'CONTACT_FORM',
      actorId: ip,
      createdAt: { gte: umHoraAtras },
    },
  })

  if (recentes >= 3) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um momento antes de enviar novamente.' },
      { status: 429 },
    )
  }

  const { nome, email, assunto, mensagem } = parsed.data

  await audit({
    actorId:    ip,
    actorName:  nome,
    action:     'CONTACT_FORM',
    targetType: 'Contato',
    meta:       { email, assunto, mensagem },
  })

  const adminEmail = process.env.EMAIL_ADMIN ?? ''
  if (adminEmail) {
    const { subject, html } = emailContatoRecebido({ nome, email, assunto, mensagem })
    void sendEmail(adminEmail, subject, html)
  }

  return NextResponse.json({ ok: true })
}
