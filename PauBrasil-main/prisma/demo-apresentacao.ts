/**
 * Conteúdo de DEMONSTRAÇÃO para a apresentação à diretoria (out/2026).
 * Dados fictícios, a serem trocados por dados reais pelo módulo Gente.
 *
 * Uso:
 *   npx tsx prisma/demo-apresentacao.ts            # só mostra o que faria
 *   npx tsx prisma/demo-apresentacao.ts --gravar   # cria (pula o que já existe)
 *   npx tsx prisma/demo-apresentacao.ts --remover  # apaga exatamente o que este script cria
 *
 * Cria: avisos e vagas (Notícias gerais), mural, calendário, números do mês e 3 cursos.
 * As vagas ficam na empresa "Demonstração (remover)", que não aparece no site público.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const ano = new Date().getFullYear()
const mes = new Date(`${new Date().toISOString().slice(0, 7)}-01T12:00:00-03:00`)
const dia = (iso: string) => new Date(`${iso}T12:00:00-03:00`)
const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000)

const EMPRESA_DEMO = { slug: 'demo-apresentacao', nome: 'Demonstração (remover)' }

const AVISOS = [
  { title: 'Processo seletivo aberto', texto: 'Estamos contratando para Patos e Sumé. Cadastre seu currículo no portal de carreiras.', link: '/carreiras', linkLabel: 'Ver cargos', destaque: true, ordem: 0 },
  { title: 'Horário de fim de ano', texto: 'O expediente administrativo será reduzido entre 24/12 e 02/01.', ordem: 1 },
]

const RECONHECIMENTOS = [
  { nome: 'Maria Teste', cargo: 'Supervisora Comercial', company: 'bebidas', unit: 'Sousa (PB)', categoria: 'meta', motivo: 'Bateu 120% da meta de positivação no trimestre com a equipe toda.' },
  { nome: 'João Exemplo', cargo: 'Motorista', company: 'bebidas', unit: 'Patos (PB)', categoria: 'tempo-de-casa', motivo: 'Dez anos de casa, sempre com zero ocorrências na rota.' },
  { nome: 'Ana Silva', cargo: 'Consultora', company: 'motos', unit: 'Petrolina (PE)', categoria: 'elogio', motivo: 'Recebeu três elogios de clientes pelo atendimento no pós-venda.' },
]

const CAMPANHAS = [
  { title: 'Setembro Amarelo', descricao: 'Mês de prevenção ao suicídio e cuidado com a saúde emocional.', inicio: `${ano}-09-01`, fim: `${ano}-09-30`, cor: 'amarelo' },
  { title: 'Outubro Rosa', descricao: 'Conscientização sobre a prevenção do câncer de mama.', inicio: `${ano}-10-01`, fim: `${ano}-10-31`, cor: 'rosa' },
  { title: 'Novembro Azul', descricao: 'Cuidado com a saúde do homem e prevenção do câncer de próstata.', inicio: `${ano}-11-01`, fim: `${ano}-11-30`, cor: 'azul' },
]

const NUMEROS = [
  { label: 'horas de treinamento', valor: 1240, sufixo: 'h', ordem: 0 },
  { label: 'colaboradores homenageados', valor: 38, sufixo: null, ordem: 1 },
  { label: 'ações sociais', valor: 12, sufixo: null, ordem: 2 },
]

const VAGAS = [
  { cargo: 'Ajudante de Distribuição', unidadeTexto: 'Patos', quantidadeVagas: 4, dataAbertura: diasAtras(9) },
  { cargo: 'Motorista Entregador', unidadeTexto: 'Sumé', quantidadeVagas: 1, dataAbertura: diasAtras(2) },
]

const CURSOS: [string, string, string[]][] = [
  ['Integração Pau Brasil', 'Nossa história, cultura e jeito de trabalhar para quem está chegando.', ['Boas-vindas ao grupo', 'Nossa história', 'Cultura e valores', 'Segurança no trabalho']],
  ['Liderança na prática', 'Ferramentas de gestão de equipe compartilhadas pelos nossos líderes.', ['O papel do líder', 'Feedback que funciona', 'Rotina de gestão']],
  ['Atendimento ao cliente', 'Como encantar o cliente do primeiro contato ao pós-venda.', ['Primeiro contato', 'Escuta ativa', 'Resolução de problemas', 'Pós-venda', 'Indicadores']],
]

async function remover() {
  const r = await prisma.$transaction([
    prisma.endoAviso.deleteMany({ where: { title: { in: AVISOS.map((a) => a.title) } } }),
    prisma.endoReconhecimento.deleteMany({ where: { nome: { in: RECONHECIMENTOS.map((x) => x.nome) } } }),
    prisma.endoCampanha.deleteMany({ where: { title: { in: CAMPANHAS.map((c) => c.title) }, createdById: null } }),
    prisma.endoNumero.deleteMany({ where: { label: { in: NUMEROS.map((n) => n.label) }, createdById: null } }),
    prisma.recVaga.deleteMany({ where: { empresa: { slug: EMPRESA_DEMO.slug } } }),
    prisma.empresa.deleteMany({ where: { slug: EMPRESA_DEMO.slug } }),
    prisma.uPBEpisodio.deleteMany({ where: { temporada: { titulo: { in: CURSOS.map((c) => c[0]) } } } }),
    prisma.uPBTemporada.deleteMany({ where: { titulo: { in: CURSOS.map((c) => c[0]) } } }),
  ])
  console.log('removidos:', r.map((x) => x.count).join(' / '))
}

async function criar(gravar: boolean) {
  const log = (o: string, n: number) => console.log(`${gravar ? '+' : '~'} ${o}: ${n}`)
  const novos = async <T,>(itens: T[], existe: (i: T) => Promise<unknown>) => {
    const r: T[] = []
    for (const i of itens) if (!(await existe(i))) r.push(i)
    return r
  }

  const avisos = await novos(AVISOS, (a) => prisma.endoAviso.findFirst({ where: { title: a.title } }))
  const recs = await novos(RECONHECIMENTOS, (x) => prisma.endoReconhecimento.findFirst({ where: { nome: x.nome } }))
  const camps = await novos(CAMPANHAS, (c) => prisma.endoCampanha.findFirst({ where: { title: c.title } }))
  const nums = await novos(NUMEROS, (n) => prisma.endoNumero.findFirst({ where: { label: n.label, mes } }))
  const cursos = await novos(CURSOS, (c) => prisma.uPBTemporada.findFirst({ where: { titulo: c[0] } }))
  const empresa = await prisma.empresa.findUnique({ where: { slug: EMPRESA_DEMO.slug } })
  const vagas = empresa ? [] : VAGAS

  log('avisos', avisos.length); log('reconhecimentos', recs.length); log('campanhas do calendário', camps.length)
  log('números do mês', nums.length); log('vagas', vagas.length); log('cursos', cursos.length)
  if (!gravar) return console.log('\nNada gravado. Rode com --gravar para criar.')

  if (avisos.length) await prisma.endoAviso.createMany({ data: avisos.map((a) => ({ ...a, published: true })) })
  if (recs.length) await prisma.endoReconhecimento.createMany({ data: recs.map((x) => ({ ...x, mes, published: true })) })
  if (camps.length) await prisma.endoCampanha.createMany({ data: camps.map((c) => ({ ...c, inicio: dia(c.inicio), fim: dia(c.fim), published: true })) })
  if (nums.length) await prisma.endoNumero.createMany({ data: nums.map((n) => ({ ...n, mes })) })
  if (vagas.length) {
    const e = await prisma.empresa.create({ data: { nome: EMPRESA_DEMO.nome, slug: EMPRESA_DEMO.slug } })
    await prisma.recVaga.createMany({ data: vagas.map((v) => ({ ...v, empresaId: e.id })) })
  }
  for (const [titulo, descricao, eps] of cursos) {
    await prisma.uPBTemporada.create({
      data: {
        titulo, descricao, ativo: true,
        episodios: { create: eps.map((t, i) => ({ titulo: t, videoUrl: 'https://example.com/video', ordem: i + 1, duracaoMin: 8 + i * 3, publicado: true })) },
      },
    })
  }
  console.log('\nGravado.')
}

;(process.argv.includes('--remover') ? remover() : criar(process.argv.includes('--gravar')))
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
