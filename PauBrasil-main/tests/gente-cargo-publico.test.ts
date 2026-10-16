import assert from 'node:assert/strict'
import test from 'node:test'

import {
  agruparParaSite,
  montarFormacao,
  nomesPublicados,
  projetarCargoPublico,
  acharDescritivo,
  chaveDeCargo,
  indexarPorCargo,
  montarCatalogo,
  nomesDoCatalogo,
  gruposDosCargos,
  type CargoInterno,
} from '../src/lib/gente/cargo-publico'

const cargo = (over: Partial<CargoInterno> = {}): CargoInterno => ({
  id: 'c1',
  cargo: 'Ajudante de Armazém',
  area: 'Logística',
  tipoVaga: 'Operacional',
  descricaoAtividades: 'Zelar pela organização do armazém.',
  experienciaSugerida: null,
  formacao: 'Ensino Fundamental',
  statusCurso: 'Formado',
  curso: null,
  exigencias: 'Disponibilidade de horário',
  publicarNoSite: true,
  grupoPublico: 'armazem',
  turnos: [],
  ...over,
})

// ─── O que NÃO pode vazar ─────────────────────────────────────────────────────

test('a projecao publica nao carrega campo interno nenhum', () => {
  /*
    O teste que dá sentido ao arquivo. Se alguém adicionar um campo interno à
    projeção, quebra aqui — e não depois, com a prova do processo seletivo
    publicada no site.
  */
  const interno = {
    ...cargo(),
    testes: 'Lógica, Excel, Matemática Intermediário',
    etapasProcesso: 'Triagem, Testes, Entrevista, ASO',
    observacoes: 'Distância menor que 1h trabalho x residência',
    precisaAderenciaRaio: true,
    competenciasSugeridas: 'Perfil analítico e proativo',
  } as CargoInterno

  const [publico] = projetarCargoPublico(interno)
  const texto = JSON.stringify(publico).toLowerCase()

  for (const proibido of ['lógica', 'excel', 'triagem', 'aso', 'distância menor', 'proativo']) {
    assert.ok(!texto.includes(proibido.toLowerCase()), `vazou conteúdo interno: "${proibido}"`)
  }

  assert.deepEqual(Object.keys(publico).sort(), [
    'atividades', 'cargo', 'exigencias', 'experiencia', 'formacao',
    'formacaoCompleta', 'grupo', 'grupoSlug', 'id', 'tipoVaga', 'turno',
  ])
})

test('cargo nao publicado nao aparece', () => {
  assert.deepEqual(projetarCargoPublico(cargo({ publicarNoSite: false })), [])
})

test('cargo sem grupo publico nao aparece', () => {
  // Sem grupo não há onde encaixá-lo na página, e inventar um lugar é pior
  // do que omitir.
  assert.deepEqual(projetarCargoPublico(cargo({ grupoPublico: null })), [])
  assert.deepEqual(projetarCargoPublico(cargo({ grupoPublico: 'grupo-que-nao-existe' })), [])
})

// ─── Turnos ───────────────────────────────────────────────────────────────────

test('um descritivo com dois turnos vira duas opcoes publicas', () => {
  // Decisão do PO: um descritivo serve os dois turnos.
  const publicos = projetarCargoPublico(cargo({ turnos: ['Diurno', 'Noturno'] }))

  assert.equal(publicos.length, 2)
  assert.deepEqual(publicos.map((p) => p.cargo), [
    'Ajudante de Armazém - Diurno',
    'Ajudante de Armazém - Noturno',
  ])
  assert.deepEqual(publicos.map((p) => p.turno), ['Diurno', 'Noturno'])
})

test('as duas opcoes apontam para o MESMO descritivo', () => {
  const publicos = projetarCargoPublico(cargo({ turnos: ['Diurno', 'Noturno'] }))

  assert.equal(publicos[0].id, publicos[1].id)
  assert.equal(publicos[0].atividades, publicos[1].atividades)
})

test('sem turno, o cargo aparece uma vez e sem sufixo', () => {
  const publicos = projetarCargoPublico(cargo({ turnos: [] }))

  assert.equal(publicos.length, 1)
  assert.equal(publicos[0].cargo, 'Ajudante de Armazém')
  assert.equal(publicos[0].turno, null)
})

test('turno em branco na lista e ignorado', () => {
  // Campo de texto livre no cadastro; vírgula sobrando não pode virar
  // "Ajudante de Armazém - ".
  const publicos = projetarCargoPublico(cargo({ turnos: ['Diurno', '  ', ''] }))

  assert.equal(publicos.length, 1)
  assert.equal(publicos[0].cargo, 'Ajudante de Armazém - Diurno')
})

// ─── Formação ─────────────────────────────────────────────────────────────────

test('formacao junta nivel, situacao e curso numa linha', () => {
  assert.equal(
    montarFormacao({ formacao: 'Ensino Superior', statusCurso: 'Cursando', curso: 'Administração' }),
    'Ensino Superior · Cursando · Administração'
  )
})

test('formacao ignora as partes que faltam', () => {
  assert.equal(montarFormacao({ formacao: 'Ensino Médio', statusCurso: null, curso: null }), 'Ensino Médio')
  assert.equal(montarFormacao({ formacao: null, statusCurso: null, curso: null }), null)
  assert.equal(montarFormacao({ formacao: '  ', statusCurso: null, curso: null }), null)
})

// ─── Agrupamento ──────────────────────────────────────────────────────────────

test('agrupa na ordem curada da pagina, nao na do banco', () => {
  const grupos = agruparParaSite([
    cargo({ id: 'a', cargo: 'Gerente Financeiro', grupoPublico: 'financeiro' }),
    cargo({ id: 'b', cargo: 'Ajudante de Armazém', grupoPublico: 'armazem' }),
  ])

  assert.deepEqual(grupos.map((g) => g.slug), ['armazem', 'financeiro'], 'Armazém vem antes')
})

test('grupo sem cargo publicado nao aparece — acordeao vazio e ruido', () => {
  const grupos = agruparParaSite([cargo({ grupoPublico: 'armazem' })])

  assert.equal(grupos.length, 1)
  assert.equal(grupos[0].slug, 'armazem')
})

test('cargos do grupo saem em ordem alfabetica pt-BR', () => {
  const grupos = agruparParaSite([
    cargo({ id: '1', cargo: 'Zelador', grupoPublico: 'armazem' }),
    cargo({ id: '2', cargo: 'Ájax', grupoPublico: 'armazem' }),
    cargo({ id: '3', cargo: 'Analista', grupoPublico: 'armazem' }),
  ])

  assert.deepEqual(grupos[0].cargos.map((c) => c.cargo), ['Ájax', 'Analista', 'Zelador'])
})

test('os turnos entram na contagem do grupo', () => {
  const grupos = agruparParaSite([cargo({ turnos: ['Diurno', 'Noturno'] })])

  assert.equal(grupos[0].cargos.length, 2, 'duas opções para o candidato')
})

test('nomesPublicados devolve o que o candidato pode escolher', () => {
  const nomes = nomesPublicados([
    cargo({ id: '1', turnos: ['Diurno', 'Noturno'] }),
    cargo({ id: '2', cargo: 'Gerente de Logística', grupoPublico: 'armazem' }),
    cargo({ id: '3', cargo: 'Cargo Secreto', publicarNoSite: false }),
  ])

  assert.deepEqual(nomes, [
    'Ajudante de Armazém - Diurno',
    'Ajudante de Armazém - Noturno',
    'Gerente de Logística',
  ])
  assert.ok(!nomes.includes('Cargo Secreto'))
})

// ─── Casamento com a lista pública ────────────────────────────────────────────

test('o descritivo sem turno casa com o cargo da pagina que tem turno', () => {
  /*
    O bug que o PO viu: publicou "Ajudante de Armazém" e nada mudou no site,
    porque a página oferece "Ajudante de Armazém - Diurno" e "- Noturno" e o
    casamento era por nome exato.
  */
  const indice = indexarPorCargo(projetarCargoPublico(cargo({ cargo: 'Ajudante de Armazém' })))

  assert.ok(acharDescritivo('Ajudante de Armazém - Diurno', indice), 'Diurno acha')
  assert.ok(acharDescritivo('Ajudante de Armazém - Noturno', indice), 'Noturno acha')
  assert.ok(acharDescritivo('Ajudante de Armazém', indice), 'sem turno também acha')
})

test('os dois turnos apontam para o mesmo descritivo', () => {
  const indice = indexarPorCargo(projetarCargoPublico(cargo({ cargo: 'Ajudante de Armazém' })))

  assert.equal(
    acharDescritivo('Ajudante de Armazém - Diurno', indice)!.id,
    acharDescritivo('Ajudante de Armazém - Noturno', indice)!.id
  )
})

test('chaveDeCargo colapsa acento, caixa, turno e preposicao', () => {
  // A asserção é de comportamento, não da string produzida: o que importa é
  // que as grafias que significam o mesmo cargo caiam na mesma chave.
  const esperado = chaveDeCargo('Ajudante de Armazém')

  assert.equal(chaveDeCargo('Ajudante de Armazém - Diurno'), esperado)
  assert.equal(chaveDeCargo('AJUDANTE DE ARMAZEM NOTURNO'), esperado)
  assert.equal(chaveDeCargo('Ajudante do Armazém'), esperado, 'preposição não distingue cargo')
})

test('preposicao diferente nao cria cargo novo', () => {
  /*
    O defeito que o PO viu: publicou "Ajudante de Distribuição", a lista da
    página tinha "Ajudante da Distribuição", e o grupo passou de 4 para 5
    cargos com a mesma função duas vezes.
  */
  assert.equal(
    chaveDeCargo('Ajudante de Distribuição'),
    chaveDeCargo('Ajudante da Distribuição')
  )
})

test('turno so e removido no FIM do nome', () => {
  // "Supervisor Noturno de Frota" tem o turno no meio e é outro cargo.
  assert.notEqual(chaveDeCargo('Supervisor Noturno de Frota'), chaveDeCargo('Supervisor de Frota'))
  assert.ok(chaveDeCargo('Supervisor Noturno de Frota').includes('noturno'))
})

test('cargos realmente diferentes continuam diferentes', () => {
  // A chave ficou mais frouxa; ela não pode passar a fundir o que é distinto.
  assert.notEqual(chaveDeCargo('Ajudante de Armazém'), chaveDeCargo('Conferente de Armazém'))
  assert.notEqual(chaveDeCargo('Motorista'), chaveDeCargo('Motorista de Carreta'))
  assert.notEqual(chaveDeCargo('Coordenador de Armazém'), chaveDeCargo('Coordenador de Frotas'))
})

test('cargo diferente nao casa por engano', () => {
  const indice = indexarPorCargo(projetarCargoPublico(cargo({ cargo: 'Ajudante de Armazém' })))

  assert.equal(acharDescritivo('Conferente de Armazém - Diurno', indice), null)
  assert.equal(acharDescritivo('Ajudante de Distribuição', indice), null)
})

test('descritivo com turnos declarados tambem casa pelos dois lados', () => {
  // Já que o desdobramento gera "X - Diurno" e "X - Noturno", e a chave os
  // colapsa, um índice com os dois não pode perder nenhum dos lados.
  const indice = indexarPorCargo(projetarCargoPublico(cargo({ turnos: ['Diurno', 'Noturno'] })))

  assert.equal(indice.size, 1, 'colapsam numa chave só')
  assert.ok(acharDescritivo('Ajudante de Armazém - Diurno', indice))
  assert.ok(acharDescritivo('Ajudante de Armazém', indice))
})

// ─── Catálogo da página ───────────────────────────────────────────────────────

test('o catalogo e montado SO com descritivos', () => {
  /*
    Até 2026-09-23 esta função unia a lista curada de `carreiras-areas.ts` com
    os descritivos. A união mantinha no ar cargos sem descrição nenhuma, que o
    candidato escolhia sem saber o que eram. Decisão do PO: cargo sem
    descritivo não aparece.
  */
  assert.deepEqual(montarCatalogo([]), [], 'sem descritivo, sem catálogo')

  const nomes = nomesDoCatalogo(montarCatalogo([cargo()]))
  assert.deepEqual(nomes, ['Ajudante de Armazém'])
})

test('o grupo vem do escolhido, ou e deduzido da area interna', () => {
  // Com a publicação virando padrão, exigir escolha de grupo transformaria
  // "publicado" em "publicado e invisível".
  const semGrupo = montarCatalogo([
    cargo({ id: 'x', cargo: 'Analista Financeiro', area: 'Financeiro', grupoPublico: null }),
  ])

  assert.equal(semGrupo.length, 1)
  assert.equal(semGrupo[0].slug, 'financeiro')
})

test('area ambigua nao e deduzida — Logistica se divide na pagina', () => {
  /*
    Na página, Logística vira Armazém, Distribuição ou Frota. Deduzir colocaria
    um motorista dentro de Armazém, então a área fica sem grupo e o cargo não
    aparece até alguém decidir.
  */
  const catalogo = montarCatalogo([
    cargo({ id: 'x', cargo: 'Motorista', area: 'Logística', grupoPublico: null }),
  ])

  assert.deepEqual(catalogo, [])
})

test('grupo escolhido a mao ganha da deducao', () => {
  const catalogo = montarCatalogo([
    cargo({ id: 'x', cargo: 'Motorista', area: 'Logística', grupoPublico: 'distribuicao' }),
  ])

  assert.equal(catalogo[0].slug, 'distribuicao')
})

test('TI e os programas ganharam grupo proprio', () => {
  const catalogo = montarCatalogo([
    cargo({ id: '1', cargo: 'Analista TI', area: 'TI', grupoPublico: null }),
    cargo({ id: '2', cargo: 'Aprendiz', area: 'Todas', grupoPublico: null }),
    cargo({ id: '3', cargo: 'Trainee', area: 'Administrativo', grupoPublico: null }),
  ])

  const slugs = catalogo.map((g) => g.slug).sort()
  assert.deepEqual(slugs, ['programas', 'tecnologia'])
})

test('grupo sem cargo nenhum nao aparece', () => {
  const catalogo = montarCatalogo([cargo()])

  assert.equal(catalogo.length, 1)
  assert.equal(catalogo[0].slug, 'armazem')
})

test('vaga aberta marca o cargo e o faz subir no grupo', () => {
  const catalogo = montarCatalogo(
    [
      cargo({ id: '1', cargo: 'Zelador' }),
      cargo({ id: '2', cargo: 'Ajudante de Armazém' }),
    ],
    ['Zelador']
  )

  assert.equal(catalogo[0].cargos[0].cargo, 'Zelador', 'subiu para o topo')
  assert.equal(catalogo[0].cargos[0].vagaAberta, true)
  assert.equal(catalogo[0].cargos[1].vagaAberta, false)
})

test('vaga aberta casa ignorando turno, caixa e acento', () => {
  const catalogo = montarCatalogo([cargo()], ['AJUDANTE DE ARMAZEM - NOTURNO'])

  assert.equal(catalogo[0].cargos[0].vagaAberta, true)
})

test('sem vaga aberta, a ordem e alfabetica', () => {
  const catalogo = montarCatalogo([
    cargo({ id: '1', cargo: 'Zelador' }),
    cargo({ id: '2', cargo: 'Ájax' }),
    cargo({ id: '3', cargo: 'Analista' }),
  ])

  assert.deepEqual(catalogo[0].cargos.map((c) => c.cargo), ['Ájax', 'Analista', 'Zelador'])
})

test('o mesmo cargo nao entra duas vezes', () => {
  // Dois descritivos que só diferem por preposição são o mesmo cargo.
  const catalogo = montarCatalogo([
    cargo({ id: '1', cargo: 'Ajudante de Armazém' }),
    cargo({ id: '2', cargo: 'Ajudante do Armazém' }),
  ])

  assert.equal(catalogo[0].cargos.length, 1)
})

test('nomesDoCatalogo e a lista de permitidos do envio', () => {
  // Se o catálogo cresce e a validação não, o candidato vê a opção e não
  // consegue enviar. Os dois saem da mesma função de propósito.
  const catalogo = montarCatalogo([cargo({ id: 'x', cargo: 'Analista Financeiro', area: 'Financeiro' })])

  assert.ok(nomesDoCatalogo(catalogo).includes('Analista Financeiro'))
})

test('gruposDosCargos deriva o grupo do que foi escolhido', () => {
  const catalogo = montarCatalogo([
    cargo({ id: '1', cargo: 'Ajudante de Armazém' }),
    cargo({ id: '2', cargo: 'Analista Financeiro', area: 'Financeiro', grupoPublico: null }),
  ])

  assert.deepEqual(
    gruposDosCargos(catalogo, ['Ajudante de Armazém', 'Analista Financeiro']),
    ['armazem', 'financeiro']
  )
  assert.deepEqual(gruposDosCargos(catalogo, ['Cargo Inexistente']), [], 'não inventa grupo')
})

test('cargo nao publicado fica fora do catalogo', () => {
  assert.deepEqual(montarCatalogo([cargo({ publicarNoSite: false })]), [])
})
