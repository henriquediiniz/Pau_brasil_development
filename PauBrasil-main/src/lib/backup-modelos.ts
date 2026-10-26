import { Prisma } from '@prisma/client'

/**
 * O que entra no backup, derivado do próprio schema (Prisma DMMF).
 *
 * Até out/2026 a lista de tabelas era escrita à mão e parou no tempo: o backup
 * diário não levava nada do módulo Gente, da newsletter nem do endomarketing
 * (20 tabelas). Agora todo model entra sozinho, na ordem das chaves
 * estrangeiras, e só fica de fora o que estiver em `FORA_DO_BACKUP`, com motivo.
 */

/** Models que não vão para o backup. */
export const FORA_DO_BACKUP: Record<string, string> = {
  LimiteTentativa: 'contador temporário de tentativas; some sozinho em minutos',
}

export interface ModeloBackup {
  /** Nome do model no schema (chave usada no arquivo de backup). */
  nome: string
  /** Acessor no PrismaClient (`prisma[delegate]`). */
  delegate: string
  /** Campo de chave primária (`id`, ou `key` no SystemConfig). */
  chave: string
  /** Chaves estrangeiras gravadas num segundo passo (auto-referência ou ciclo). */
  segundoPasso: string[]
  /** Campos binários (Bytes), que vão em base64 no JSON. */
  binarios: string[]
}

const delegateDe = (nome: string) => nome.charAt(0).toLowerCase() + nome.slice(1)

function montarOrdem(): ModeloBackup[] {
  const modelos = Prisma.dmmf.datamodel.models.filter((m) => !(m.name in FORA_DO_BACKUP))
  const nomes = new Set(modelos.map((m) => m.name))

  // Dependências: cada FK aponta para o model referenciado. Auto-referência vai para o 2º passo.
  const deps = new Map<string, Map<string, string[]>>()
  const segundoPasso = new Map<string, string[]>()
  for (const m of modelos) {
    const alvo = new Map<string, string[]>()
    for (const f of m.fields) {
      if (f.kind !== 'object' || !f.relationFromFields?.length || !nomes.has(f.type)) continue
      if (f.type === m.name) {
        segundoPasso.set(m.name, [...(segundoPasso.get(m.name) ?? []), ...f.relationFromFields])
        continue
      }
      alvo.set(f.type, [...(alvo.get(f.type) ?? []), ...f.relationFromFields])
    }
    deps.set(m.name, alvo)
  }

  // Ordenação topológica estável (segue a ordem do schema quando não há dependência).
  const ordem: string[] = []
  const restantes = modelos.map((m) => m.name)
  while (restantes.length) {
    const pronto = restantes.find((nome) =>
      Array.from(deps.get(nome)!.keys()).every((d) => ordem.includes(d)),
    )
    if (pronto) {
      ordem.push(pronto)
      restantes.splice(restantes.indexOf(pronto), 1)
      continue
    }
    // Ciclo entre models: o primeiro restante entra já, e as FKs para quem ainda
    // não entrou vão para o 2º passo (são opcionais num ciclo válido).
    const nome = restantes.shift()!
    for (const [alvo, campos] of Array.from(deps.get(nome)!.entries())) {
      if (!ordem.includes(alvo)) segundoPasso.set(nome, [...(segundoPasso.get(nome) ?? []), ...campos])
    }
    ordem.push(nome)
  }

  return ordem.map((nome) => {
    const m = modelos.find((x) => x.name === nome)!
    const chave = m.fields.find((f) => f.isId)?.name
    if (!chave) throw new Error(`[backup] ${nome} não tem chave primária simples; adicione a FORA_DO_BACKUP ou trate aqui`)
    return {
      nome,
      delegate: delegateDe(nome),
      chave,
      segundoPasso: segundoPasso.get(nome) ?? [],
      binarios: m.fields.filter((f) => f.type === 'Bytes').map((f) => f.name),
    }
  })
}

/** Models na ordem de gravação (pais antes dos filhos). */
export const MODELOS_BACKUP: ModeloBackup[] = montarOrdem()

export const modeloBackup = (nome: string) => MODELOS_BACKUP.find((m) => m.nome === nome)
