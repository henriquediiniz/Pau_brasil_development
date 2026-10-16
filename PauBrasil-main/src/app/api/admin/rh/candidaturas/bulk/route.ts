import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { CARREIRAS_GRUPOS } from '@/lib/carreiras-areas'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface BulkItem {
  nome:             string
  email:            string
  telefone?:        string
  cidade:           string
  estado:           string
  cargosInteresse:  string[]
  cvUrl:            string
  cvPublicId:       string
  cvOriginalFilename?: string
  cvSizeBytes?:     number
  cvMimeType?:      string
  cvHash:           string
}

function deriveGrupos(cargos: string[]): string[] {
  return CARREIRAS_GRUPOS
    .filter(g => g.cargos.some(c => cargos.includes(c)))
    .map(g => g.slug)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let items: BulkItem[]
  try { items = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: 'Nenhum item enviado' }, { status: 400 })

  if (items.length > 100)
    return NextResponse.json({ error: 'Máximo 100 candidaturas por lote' }, { status: 400 })

  // Checar hashes já existentes para não duplicar o mesmo arquivo
  const hashes = items.map(i => i.cvHash)
  const existentes = await prisma.candidatura.findMany({
    where: { cvHash: { in: hashes } },
    select: { cvHash: true, nome: true },
  })
  const hashSet = new Set(existentes.map(e => e.cvHash))

  let created = 0
  let skipped = 0
  const errors: { nome: string; reason: string }[] = []

  for (const item of items) {
    if (hashSet.has(item.cvHash)) {
      skipped++
      continue
    }

    try {
      await prisma.candidatura.create({
        data: {
          nome:              item.nome.trim(),
          email:             item.email.trim().toLowerCase(),
          telefone:          item.telefone?.trim() || null,
          cidade:            item.cidade.trim() || 'Não informada',
          estado:            item.estado || 'PB',
          cargosInteresse:   item.cargosInteresse,
          gruposInteresse:   deriveGrupos(item.cargosInteresse),
          cvUrl:             item.cvUrl,
          cvPublicId:        item.cvPublicId,
          cvOriginalFilename: item.cvOriginalFilename ?? null,
          cvSizeBytes:       item.cvSizeBytes ?? null,
          cvMimeType:        item.cvMimeType ?? 'application/pdf',
          cvHash:            item.cvHash,
          mensagem:          '[Importado pelo RH]',
          consentimentoLgpd: false,
          etapa:             'RECEBIDO',
        },
      })
      hashSet.add(item.cvHash) // evita duplicar dentro do mesmo lote
      created++
    } catch (err) {
      errors.push({ nome: item.nome, reason: String(err) })
    }
  }

  audit({
    actorId:    session.user.id,
    actorName:  session.user.name ?? session.user.email ?? '',
    action:     'CANDIDATURA_BULK_IMPORTADA',
    targetType: 'Candidatura',
    meta:       { created, skipped, errors: errors.length },
  }).catch(console.error)

  return NextResponse.json({ created, skipped, errors })
}
