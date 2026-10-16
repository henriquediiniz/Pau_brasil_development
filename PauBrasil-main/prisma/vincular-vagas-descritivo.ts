/**
 * Vincula ao descritivo as vagas que já existiam antes do campo passar a ser
 * preenchido.
 *
 * `RecVaga.cargoId` existe desde a Fase 1 e ficou vazio até 2026-09-23, quando
 * o formulário e o importador passaram a preenchê-lo. As vagas criadas antes
 * disso continuam casando com o descritivo pelo nome — funciona, mas quebra
 * em silêncio ao renomear um dos dois.
 *
 * Este script casa pelo nome **uma vez** e grava o id. Depois disso o vínculo
 * para de depender de digitação.
 *
 * Uso:
 *   npx tsx prisma/vincular-vagas-descritivo.ts          # só mostra o que faria
 *   npx tsx prisma/vincular-vagas-descritivo.ts --gravar # grava
 *
 * É idempotente: só olha vagas com `cargoId` nulo, então rodar de novo não
 * desfaz nem sobrescreve vínculo escolhido à mão.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Mesma normalização do importador: sem acento, sem caixa, sem pontuação. */
function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function main() {
  const gravar = process.argv.includes('--gravar')

  const [vagas, descritivos] = await Promise.all([
    prisma.recVaga.findMany({
      where: { cargoId: null },
      select: { id: true, cargo: true, area: true, empresaId: true },
    }),
    prisma.recCargo.findMany({
      where: { ativo: true },
      select: { id: true, cargo: true, area: true, empresaId: true },
    }),
  ])

  console.log(`Vagas sem vínculo: ${vagas.length}`)
  console.log(`Descritivos ativos: ${descritivos.length}\n`)

  const casadas: { id: string; cargo: string; descritivo: string }[] = []
  const semDescritivo: string[] = []

  for (const vaga of vagas) {
    // A empresa entra na chave: descritivo de outra empresa não pode virar o
    // vínculo de uma vaga daqui.
    const candidatos = descritivos.filter(
      (d) => d.empresaId === vaga.empresaId && normalizar(d.cargo) === normalizar(vaga.cargo)
    )

    if (candidatos.length === 0) {
      semDescritivo.push(vaga.cargo)
      continue
    }

    // Mais de um descritivo com o mesmo cargo: a área desempata, como no
    // verificador de aderência.
    const escolhido =
      candidatos.find((d) => normalizar(d.area) === normalizar(vaga.area ?? '')) ?? candidatos[0]

    casadas.push({ id: vaga.id, cargo: vaga.cargo, descritivo: escolhido.cargo })

    if (gravar) {
      await prisma.recVaga.update({ where: { id: vaga.id }, data: { cargoId: escolhido.id } })
    }
  }

  console.log(`Casaram: ${casadas.length}`)
  casadas.forEach((c) => console.log(`  ${c.cargo}  ->  ${c.descritivo}`))

  if (semDescritivo.length > 0) {
    console.log(`\nSem descritivo (seguem casando por nome): ${semDescritivo.length}`)
    Array.from(new Set(semDescritivo)).forEach((c) => console.log(`  ${c}`))
  }

  console.log(
    gravar
      ? '\nGravado.'
      : '\nNada foi gravado. Rode com --gravar para aplicar.'
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
