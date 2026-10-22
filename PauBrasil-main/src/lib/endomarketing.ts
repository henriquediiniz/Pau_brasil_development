/**
 * Endomarketing da página /nossa-gente: mural de reconhecimento, calendário de
 * campanhas e números do mês. Cadastrado em /gente/endomarketing.
 */

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { urlDeImagemSchema } from '@/lib/armazenamento'
import { HUB_COMPANIES } from '@/lib/hub-content'

const slugsEmpresas = HUB_COMPANIES.map((c) => c.slug) as [string, ...string[]]

import { CATEGORIAS_RECONHECIMENTO, CORES_CAMPANHA } from '@/lib/endomarketing-opcoes'

export { CATEGORIAS_RECONHECIMENTO, CORES_CAMPANHA }

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => v || null)

/** "2026-10" ou "2026-10-01" → primeiro dia do mês, meio-dia em Brasília (evita cair no mês anterior). */
const mesSchema = z
  .string()
  .regex(/^\d{4}-\d{2}(-\d{2})?$/)
  .transform((v) => new Date(`${v.slice(0, 7)}-01T12:00:00-03:00`))

const diaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((v) => new Date(`${v}T12:00:00-03:00`))

export const SCHEMAS = {
  reconhecimentos: z.object({
    nome: z.string().trim().min(2).max(80),
    cargo: z.string().trim().min(2).max(80),
    company: z.enum(slugsEmpresas),
    unit: z.string().trim().min(2).max(60),
    categoria: z.enum(Object.keys(CATEGORIAS_RECONHECIMENTO) as [string, ...string[]]),
    motivo: z.string().trim().min(10).max(280),
    fotoUrl: urlDeImagemSchema.optional().nullable().or(z.literal('').transform(() => null)),
    mes: mesSchema,
    published: z.boolean().optional(),
  }),
  campanhas: z
    .object({
      title: z.string().trim().min(3).max(80),
      descricao: z.string().trim().min(10).max(280),
      inicio: diaSchema,
      fim: diaSchema.optional().nullable().or(z.literal('').transform(() => null)),
      cor: z.enum(Object.keys(CORES_CAMPANHA) as [string, ...string[]]),
      published: z.boolean().optional(),
    })
    .refine((c) => !c.fim || c.fim >= c.inicio, { message: 'O fim deve ser depois do início', path: ['fim'] }),
  avisos: z.object({
    title: z.string().trim().min(3).max(80),
    texto: z.string().trim().min(10).max(400),
    // Interno (/carreiras) ou https externo; nada de javascript: ou outros esquemas.
    link: z
      .string()
      .trim()
      .max(300)
      .regex(/^(\/[^\s]*|https:\/\/\S+)$/, 'Link inválido')
      .optional()
      .nullable()
      .or(z.literal('').transform(() => null)),
    linkLabel: textoOpcional(40),
    destaque: z.boolean().optional(),
    ordem: z.coerce.number().int().min(0).max(99).optional(),
    published: z.boolean().optional(),
  }),
  numeros: z.object({
    label: z.string().trim().min(3).max(60),
    valor: z.coerce.number().int().min(0).max(10_000_000),
    sufixo: textoOpcional(12),
    mes: mesSchema,
    ordem: z.coerce.number().int().min(0).max(99).optional(),
  }),
} as const

export type TipoEndo = keyof typeof SCHEMAS
export const TIPOS_ENDO = Object.keys(SCHEMAS) as TipoEndo[]

export function ehTipoEndo(valor: string): valor is TipoEndo {
  return (TIPOS_ENDO as string[]).includes(valor)
}

/** Acesso ao delegate do Prisma de cada tipo (mesma interface de CRUD). */
export function tabelaEndo(tipo: TipoEndo) {
  const tabelas = {
    reconhecimentos: prisma.endoReconhecimento,
    campanhas: prisma.endoCampanha,
    numeros: prisma.endoNumero,
    avisos: prisma.endoAviso,
  } as const
  // Os três delegates têm a mesma forma de create/update/delete/findMany para o uso daqui.
  return tabelas[tipo] as unknown as {
    findMany: (args: object) => Promise<Record<string, unknown>[]>
    create: (args: object) => Promise<Record<string, unknown>>
    update: (args: object) => Promise<Record<string, unknown>>
    delete: (args: object) => Promise<Record<string, unknown>>
  }
}

export const ORDEM_GESTAO: Record<TipoEndo, object> = {
  reconhecimentos: [{ mes: 'desc' }, { createdAt: 'desc' }],
  campanhas: [{ inicio: 'asc' }],
  numeros: [{ mes: 'desc' }, { ordem: 'asc' }],
  avisos: [{ ordem: 'asc' }, { createdAt: 'desc' }],
}

export type ConteudoNossaGente = Awaited<ReturnType<typeof carregarNossaGente>>

/** Tudo que a página pública precisa. Sem banco, devolve listas vazias e a página continua no ar. */
export async function carregarNossaGente() {
  try {
    const ano = new Date().getFullYear()
    const [reconhecimentos, campanhas, ultimoMes] = await Promise.all([
      prisma.endoReconhecimento.findMany({
        where: { published: true },
        orderBy: [{ mes: 'desc' }, { createdAt: 'desc' }],
        take: 24,
      }),
      prisma.endoCampanha.findMany({
        where: {
          published: true,
          inicio: { gte: new Date(`${ano}-01-01T00:00:00-03:00`), lt: new Date(`${ano + 1}-01-01T00:00:00-03:00`) },
        },
        orderBy: { inicio: 'asc' },
      }),
      prisma.endoNumero.findFirst({ orderBy: { mes: 'desc' }, select: { mes: true } }),
    ])
    const numeros = ultimoMes
      ? await prisma.endoNumero.findMany({ where: { mes: ultimoMes.mes }, orderBy: { ordem: 'asc' } })
      : []
    return { reconhecimentos, campanhas, numeros, mesNumeros: ultimoMes?.mes ?? null, ano }
  } catch (error) {
    console.error('[endomarketing] falha ao carregar', error)
    return { reconhecimentos: [], campanhas: [], numeros: [], mesNumeros: null, ano: new Date().getFullYear() }
  }
}

/**
 * Notícias gerais da home: avisos fixos + vagas abertas do módulo Gente.
 * Das vagas, só o que pode ser público (cargo, unidade, quantidade, abertura):
 * salário, solicitante e histórico nunca saem daqui.
 */
export async function carregarNoticiasGerais() {
  try {
    const [avisos, vagas] = await Promise.all([
      prisma.endoAviso.findMany({
        where: { published: true },
        orderBy: [{ destaque: 'desc' }, { ordem: 'asc' }, { createdAt: 'desc' }],
        take: 6,
      }),
      prisma.recVaga.findMany({
        where: { status: 'ABERTA' },
        orderBy: { dataAbertura: 'desc' },
        take: 200,
        select: {
          cargo: true,
          quantidadeVagas: true,
          dataAbertura: true,
          unidadeTexto: true,
          operacao: { select: { nome: true } },
          cargoRef: { select: { cargo: true } },
        },
      }),
    ])
    // Agrupa vagas iguais (mesmo cargo na mesma unidade) somando as quantidades.
    const grupos = new Map<string, { cargo: string; unidade: string | null; quantidade: number; desde: Date }>()
    for (const v of vagas) {
      const cargo = (v.cargoRef?.cargo ?? v.cargo).trim()
      const unidade = v.operacao?.nome ?? v.unidadeTexto ?? null
      const chave = `${cargo.toLowerCase()}|${unidade ?? ''}`
      const atual = grupos.get(chave)
      if (atual) {
        atual.quantidade += v.quantidadeVagas
        if (v.dataAbertura < atual.desde) atual.desde = v.dataAbertura
      } else {
        grupos.set(chave, { cargo, unidade, quantidade: v.quantidadeVagas, desde: v.dataAbertura })
      }
    }
    return { avisos, vagas: Array.from(grupos.values()).slice(0, 8), totalVagas: grupos.size }
  } catch (error) {
    console.error('[noticias-gerais] falha ao carregar', error)
    return { avisos: [], vagas: [], totalVagas: 0 }
  }
}
