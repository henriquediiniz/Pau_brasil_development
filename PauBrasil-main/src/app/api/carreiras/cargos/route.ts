import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withHandler } from '@/lib/api-handler'
import { montarCatalogo } from '@/lib/gente/cargo-publico'

/**
 * O catálogo de cargos da página pública de carreiras.
 *
 * **Rota sem autenticação, de propósito** — quem consulta é candidato, não
 * usuário do portal. Por isso ela nunca devolve o registro do descritivo:
 * passa tudo por `montarCatalogo`, que projeta só os campos liberados.
 * O `select` explícito é a segunda barreira — o dado interno não chega nem a
 * sair do banco.
 *
 * O destaque de "vaga aberta" é **derivado do Controle de Vagas**, não de um
 * interruptor separado. Marcar à mão criaria uma segunda contabilidade: o RH
 * abriria a vaga num lugar e teria que lembrar de acender no outro, e o site
 * anunciaria vaga fechada meses depois. Aqui, abrir a vaga no módulo Gente
 * **é** acender o destaque; fechá-la apaga.
 */

export const revalidate = 300

const SELECT_PUBLICO = {
  id: true,
  cargo: true,
  area: true,
  tipoVaga: true,
  descricaoAtividades: true,
  experienciaSugerida: true,
  formacao: true,
  statusCurso: true,
  curso: true,
  exigencias: true,
  publicarNoSite: true,
  grupoPublico: true,
  turnos: true,
} as const

export const GET = withHandler(async () => {
  const [publicados, vagasAbertas] = await Promise.all([
    prisma.recCargo.findMany({
      where: { publicarNoSite: true, ativo: true },
      take: 500,
      select: SELECT_PUBLICO,
    }),
    /*
      Só o cargo, e nada mais. Uma vaga tem salário, solicitante e histórico —
      nada disso tem o que fazer numa resposta pública. O nome basta para
      acender o destaque.
    */
    prisma.recVaga.findMany({
      where: { status: 'ABERTA' },
      take: 1000,
      select: { cargo: true, cargoId: true },
    }),
  ])

  /*
    O destaque casa por nome, mas a vaga aberta a partir de um descritivo traz
    `cargoId`: nesse caso usamos o nome do proprio descritivo, que e exato.
    Assim renomear a vaga nao apaga o destaque, e acento nao desliga nada.
  */
  const nomePorId = new Map(publicados.map((c) => [c.id, c.cargo]))

  const catalogo = montarCatalogo(
    publicados,
    vagasAbertas
      .map((v) => (v.cargoId && nomePorId.get(v.cargoId)) || v.cargo)
      .filter((c): c is string => Boolean(c))
  )

  return NextResponse.json(
    {
      grupos: catalogo,
      total: catalogo.reduce((s, g) => s + g.cargos.length, 0),
      comVagaAberta: catalogo.reduce((s, g) => s + g.cargos.filter((c) => c.vagaAberta).length, 0),
    },
    {
      // A lista muda raramente e é a mesma para todo candidato. Cinco minutos
      // tiram o banco do caminho de quem está se candidatando.
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    }
  )
})
