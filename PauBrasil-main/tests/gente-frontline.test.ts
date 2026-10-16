import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calcularComprometimento,
  calcularVagasAbertas,
  calcularYtd,
  chaveCargo,
  ehDepartamento,
  ehMesValido,
  mesesDoAno,
  montarLinhas,
  resumirGeral,
  resumirSegmento,
  TETO_PADRAO,
  type CargoFrontline,
} from '../src/lib/gente/frontline'

const cargo = (over: Partial<CargoFrontline> = {}): CargoFrontline => ({
  id: 'c1',
  cargo: 'Ajudante Armazém',
  atividade: 'Apoio Logístico',
  departamento: 'DPO',
  qlpMeta: 8,
  qlpReal: 8,
  operacaoId: 'op-patos',
  ...over,
})

// ─── Vagas abertas = meta − real ──────────────────────────────────────────────

test('vaga aberta e a diferenca entre a meta e o real', () => {
  // O caso do PO: Ajudante de Distribuicao em Sousa, meta 43 e real 42.
  assert.equal(calcularVagasAbertas(43, 42), 1)
  assert.equal(calcularVagasAbertas(13, 13), 0)
})

test('real acima da meta nao vira vaga negativa', () => {
  // Negativo somado no segmento esconderia vaga aberta de outro cargo.
  assert.equal(calcularVagasAbertas(10, 12), 0)
})

test('montarLinhas calcula as vagas pela meta e pelo real', () => {
  const linhas = montarLinhas([cargo({ qlpMeta: 43, qlpReal: 42 }), cargo({ id: 'c2', qlpMeta: 5, qlpReal: 7 })])
  assert.equal(linhas[0].vagasAbertas, 1)
  assert.equal(linhas[1].vagasAbertas, 0)
})

// ─── Comprometimento ──────────────────────────────────────────────────────────

test('comprometimento e vagas abertas sobre a META', () => {
  assert.equal(calcularComprometimento(2, 8), 25)
  assert.equal(calcularComprometimento(0, 8), 0)
})

test('meta zero devolve 0, nao infinito', () => {
  // Cargo sem meta ainda não entrou no acompanhamento; "∞%" no painel só
  // assusta quem está lendo.
  assert.equal(calcularComprometimento(3, 0), 0)
  assert.ok(Number.isFinite(calcularComprometimento(3, 0)))
})

test('perder gente aumenta o comprometimento', () => {
  // Com vaga = meta - real, cada desligamento abre uma posicao e o indice sobe.
  const cheio = montarLinhas([cargo({ qlpMeta: 10, qlpReal: 10 })])[0]
  const desfalcado = montarLinhas([cargo({ qlpMeta: 10, qlpReal: 8 })])[0]
  assert.equal(cheio.comprometimento, 0)
  assert.equal(desfalcado.comprometimento, 20)
})

// ─── Linhas e resumos ─────────────────────────────────────────────────────────

test('montarLinhas marca quem passou do teto', () => {
  const linhas = montarLinhas(
    [cargo({ qlpMeta: 10, qlpReal: 10 }), cargo({ id: 'c2', cargo: 'Conferente', qlpMeta: 2, qlpReal: 1 })],
    TETO_PADRAO
  )

  assert.equal(linhas[0].vagasAbertas, 0)
  assert.equal(linhas[0].comprometimento, 0)
  assert.equal(linhas[0].acimaDoTeto, false)

  assert.equal(linhas[1].vagasAbertas, 1)
  assert.equal(linhas[1].comprometimento, 50)
  assert.equal(linhas[1].acimaDoTeto, true)
})

test('o resumo usa os TOTAIS, nao a media dos cargos', () => {
  // Um cargo de meta 1 com 1 vaga aberta da 100%. Pela media dos cargos o
  // segmento apareceria em 50%; pelos totais, 1 posicao em 71 da 1,4%.
  const linhas = montarLinhas([
    cargo({ qlpMeta: 70, qlpReal: 70, cargo: 'Ajudante Armazém' }),
    cargo({ id: 'c2', cargo: 'Conferente', qlpMeta: 1, qlpReal: 0 }),
  ])

  const resumo = resumirSegmento(linhas, 'DPO')
  assert.equal(resumo.qlpMeta, 71)
  assert.equal(resumo.vagasAbertas, 1)
  assert.ok(Math.abs(resumo.comprometimento - 1.408) < 0.01)
  assert.equal(resumo.acimaDoTeto, false, 'não passou de 3%')

  const media = linhas.reduce((s, l) => s + l.comprometimento, 0) / linhas.length
  assert.ok(media > 3, 'a média dos cargos passaria do teto — por isso não é ela')
})

test('resumo separa DPO de SPO', () => {
  const linhas = montarLinhas([
    cargo({ qlpMeta: 10, qlpReal: 9 }),
    cargo({ id: 'c2', departamento: 'SPO', cargo: 'Vendedor', qlpMeta: 20, qlpReal: 16 }),
  ])

  assert.equal(resumirSegmento(linhas, 'DPO').comprometimento, 10)
  assert.equal(resumirSegmento(linhas, 'SPO').comprometimento, 20)
})

test('resumo geral soma os dois departamentos', () => {
  const linhas = montarLinhas([
    cargo({ qlpMeta: 10, qlpReal: 9 }),
    cargo({ id: 'c2', departamento: 'SPO', cargo: 'Vendedor', qlpMeta: 10, qlpReal: 10 }),
  ])

  const geral = resumirGeral(linhas)
  assert.equal(geral.qlpMeta, 20)
  assert.equal(geral.vagasAbertas, 1)
  assert.equal(geral.comprometimento, 5)
})

test('segmento sem cargo nenhum nao quebra', () => {
  const resumo = resumirSegmento([], 'SPO')

  assert.equal(resumo.qlpMeta, 0)
  assert.equal(resumo.comprometimento, 0)
  assert.equal(resumo.acimaDoTeto, false)
})

// ─── Teto editável ────────────────────────────────────────────────────────────

test('o teto e parametro — RH pode apertar ou afrouxar', () => {
  const linhas = montarLinhas([cargo({ qlpMeta: 100, qlpReal: 96 })], 3)
  assert.equal(linhas[0].acimaDoTeto, true, '4% passa de 3%')

  const comTetoMaior = montarLinhas([cargo({ qlpMeta: 100, qlpReal: 96 })], 5)
  assert.equal(comTetoMaior[0].acimaDoTeto, false, '4% não passa de 5%')
})

test('exatamente no teto nao conta como acima', () => {
  const linhas = montarLinhas([cargo({ qlpMeta: 100, qlpReal: 97 })], 3)
  assert.equal(linhas[0].comprometimento, 3)
  assert.equal(linhas[0].acimaDoTeto, false, 'a meta é "máximo 3%", então 3% cumpre')
})

// ─── YTD ──────────────────────────────────────────────────────────────────────

test('YTD divide por 12, nao pelos meses preenchidos', () => {
  // Em março o indicador fica baixo de propósito: o ano ainda não aconteceu.
  assert.equal(calcularYtd([3, 3, 3]), 0.75)
  assert.equal(calcularYtd(Array(12).fill(3)), 3)
})

test('YTD ignora mes vazio sem virar NaN', () => {
  assert.equal(calcularYtd([3, null, undefined, 3]), 0.5)
  assert.ok(!Number.isNaN(calcularYtd([])))
})

test('mesesDoAno devolve os doze, completando o que falta com zero', () => {
  const meses = mesesDoAno([{ mes: 1, percentual: 2.5 }, { mes: 12, percentual: 4 }])

  assert.equal(meses.length, 12)
  assert.equal(meses[0].label, 'Jan')
  assert.equal(meses[0].percentual, 2.5)
  assert.equal(meses[5].percentual, 0, 'junho não foi digitado')
  assert.equal(meses[11].label, 'Dez')
  assert.equal(meses[11].percentual, 4)
})

// ─── Guardas ──────────────────────────────────────────────────────────────────

test('chaveCargo normaliza para o cruzamento', () => {
  assert.equal(chaveCargo('MOTORISTA CARRETA  PUXADA'), 'motorista carreta puxada')
  assert.equal(chaveCargo('Ajudante Armazém'), 'ajudante armazem')
  assert.equal(chaveCargo(null), '')
})

test('departamento so aceita DPO ou SPO', () => {
  assert.equal(ehDepartamento('DPO'), true)
  assert.equal(ehDepartamento('SPO'), true)
  assert.equal(ehDepartamento('dpo'), false)
  assert.equal(ehDepartamento(null), false)
})

test('mes fora de 1..12 e recusado', () => {
  assert.equal(ehMesValido(1), true)
  assert.equal(ehMesValido(12), true)
  assert.equal(ehMesValido(0), false)
  assert.equal(ehMesValido(13), false)
  assert.equal(ehMesValido(1.5), false)
  assert.equal(ehMesValido('3'), false)
})
