/**
 * Planilhas-modelo dos importadores do módulo Gente.
 *
 * Cada coluna aqui usa **exatamente um rótulo que o importador reconhece**.
 * Isso não é coincidência nem disciplina: `tests/gente-modelos.test.ts` passa
 * a linha de exemplo de cada modelo pelo analisador correspondente e exige
 * zero erro. Se alguém renomear um cabeçalho aceito sem atualizar o modelo,
 * o teste quebra.
 *
 * O objetivo é atacar o erro que mais bloqueia importação na prática: o RH
 * digitar o nome da unidade de um jeito que o sistema não reconhece. Por isso
 * o modelo sai com as operações válidas daquele usuário já listadas numa aba.
 */

export type TipoModelo =
  | 'vagas'
  | 'candidatos'
  | 'quadro'
  | 'desligamentos'
  | 'pcd'
  | 'aprendizes'
  | 'internos'
  | 'sucessao'
  | 'cargos'

export const TIPOS_MODELO: readonly TipoModelo[] = [
  'vagas',
  'candidatos',
  'quadro',
  'desligamentos',
  'pcd',
  'aprendizes',
  'internos',
  'sucessao',
  'cargos',
] as const

export interface ColunaModelo {
  /** Cabeçalho, escrito como o importador aceita. */
  titulo: string
  obrigatoria?: boolean
  /** Valor da linha de exemplo. */
  exemplo: string
  /** Explicação para a aba de instruções. */
  regra?: string
}

export interface DefinicaoModelo {
  tipo: TipoModelo
  nomeArquivo: string
  titulo: string
  colunas: ColunaModelo[]
}

/** `UNIDADE` é a única coluna que todo modelo compartilha, e a mais crítica. */
const COLUNA_UNIDADE: ColunaModelo = {
  titulo: 'Unidade',
  obrigatoria: true,
  exemplo: 'Pau Brasil Patos',
  regra:
    'Precisa bater com uma operação cadastrada no portal. Veja a aba "Operações" — a linha é recusada se não bater.',
}

const MODELO_VAGAS: DefinicaoModelo = {
  tipo: 'vagas',
  nomeArquivo: 'modelo-vagas',
  titulo: 'Controle de Vagas',
  colunas: [
    COLUNA_UNIDADE,
    { titulo: 'Cargo', obrigatoria: true, exemplo: 'Motorista Caminhão Distribuição' },
    {
      titulo: 'Data Abertura',
      obrigatoria: true,
      exemplo: '12/02/2026',
      regra: 'Base do cálculo de SLA. Aceita 12/02/2026, 2026-02-12 ou data do Excel.',
    },
    {
      titulo: 'Data Prevista Fechamento',
      exemplo: '29/03/2026',
      regra: 'Sem previsão, o sistema usa o prazo padrão de 30 dias.',
    },
    {
      titulo: 'Status',
      exemplo: 'FECHADA',
      regra: 'ABERTA, FECHADA ou CANCELADA. Em branco, é deduzido pela data de contratação.',
    },
    {
      titulo: 'Data Contratação',
      exemplo: '26/02/2026',
      regra: 'É ela que define se a vaga fechou no prazo.',
    },
    { titulo: 'Departamento', exemplo: 'DPO', regra: 'DPO ou SPO.' },
    { titulo: 'Área', exemplo: 'Distribuição Urbana' },
    {
      titulo: 'Quantidade Vagas',
      exemplo: '1',
      regra: 'Número de postos a preencher. Em branco vira 1.',
    },
    { titulo: 'Salário', exemplo: '2500,00', regra: 'Aceita 2500,00, 2.500,00 ou R$ 2.500,00.' },
    { titulo: 'Cod', exemplo: 'V-001', regra: 'Código interno da requisição, opcional. Pode repetir entre vagas diferentes: duas linhas só contam como a mesma vaga quando cargo, unidade e data de abertura também coincidem.' },
    { titulo: 'Motivo Solicitação', exemplo: 'Demissão com substituição' },
    { titulo: 'Colaborador Anterior', exemplo: 'Elexsandro Morais Firmino Filho' },
    { titulo: 'Data Desligamento', exemplo: '12/02/2026' },
    { titulo: 'Responsável Vaga', exemplo: 'Cinthya Alves' },
    { titulo: 'Solicitante Vaga', exemplo: 'Marcos Augusto' },
    { titulo: 'Nome Contratado', exemplo: 'Bruno da Silva Nunes' },
    { titulo: 'Frontline', exemplo: '2' },
    { titulo: 'Requisitos Mínimos', exemplo: 'CNH D definitiva, experiência de 6 meses' },
    { titulo: 'Formação', exemplo: 'Ensino Fundamental Completo' },
    { titulo: 'Local Trabalho', exemplo: 'Patos - PB' },
    { titulo: 'Horário', exemplo: '07:00 às 17:00' },
    { titulo: 'Informações Complementares', exemplo: '' },
    { titulo: 'Andamento Processo', exemplo: 'Processo concluído com contratação' },
  ],
}

const MODELO_CANDIDATOS: DefinicaoModelo = {
  tipo: 'candidatos',
  nomeArquivo: 'modelo-candidatos',
  titulo: 'Candidatos (stand-by)',
  colunas: [
    COLUNA_UNIDADE,
    { titulo: 'Nome', obrigatoria: true, exemplo: 'Arthur Silva' },
    { titulo: 'Cargo', exemplo: 'Motorista' },
    {
      titulo: 'Telefone',
      exemplo: '83999990000',
      regra: 'É o que identifica repetições. Sem telefone, usa nome + unidade.',
    },
    { titulo: 'E-mail', exemplo: 'arthur@exemplo.com', regra: 'E-mail malformado entra vazio, com aviso.' },
    { titulo: 'Mês Processo', exemplo: 'Fevereiro' },
    { titulo: 'DPO ou SPO', exemplo: 'DPO', regra: 'DPO ou SPO.' },
    {
      titulo: 'Situação',
      exemplo: 'EM STAND BY',
      regra: 'Em stand by, Em andamento, Contratado, Indisponível ou Não contratado.',
    },
    { titulo: 'Situação Final', exemplo: '', regra: 'Só quando o processo encerrar.' },
    { titulo: 'Data Situação Final', exemplo: '', regra: 'Preencha junto com a situação final.' },
    {
      titulo: 'Entrevistado GG',
      exemplo: 'OK',
      regra: 'OK, NÃO ou N/A. Em branco = etapa ainda não avaliada.',
    },
    { titulo: 'Aprovado Gestor', exemplo: 'OK', regra: 'OK, NÃO ou N/A.' },
    { titulo: 'Teste Prático', exemplo: 'OK', regra: 'OK, NÃO ou N/A.' },
    {
      titulo: 'Teste Direção',
      exemplo: 'N/A',
      regra: 'OK, NÃO ou N/A. Use N/A para cargo que não dirige — assim a etapa sai da conta.',
    },
    { titulo: 'Direção Teórico', exemplo: 'N/A', regra: 'OK, NÃO ou N/A.' },
    {
      titulo: 'Origem Currículo',
      exemplo: 'WhatsApp',
      regra: 'Aplicativo, WhatsApp, E-mail, Indicação, Portal ou Outro.',
    },
    { titulo: 'Quem Indicou', exemplo: '', regra: 'Preencha quando a origem for indicação.' },
    { titulo: 'Escolaridade', exemplo: 'Ensino Médio Completo' },
    { titulo: 'Residência', exemplo: 'Patos - PB' },
    { titulo: 'Habilidades', exemplo: 'CNH D, experiência com carga' },
    { titulo: 'Observação', exemplo: '' },
  ],
}

const MODELO_QUADRO: DefinicaoModelo = {
  tipo: 'quadro',
  nomeArquivo: 'modelo-quadro-qlp',
  titulo: 'Quadro de pessoal (QLP)',
  colunas: [
    COLUNA_UNIDADE,
    {
      titulo: 'Nome',
      obrigatoria: true,
      exemplo: 'Maria Souza',
      regra: 'Nome + unidade é o que identifica repetições.',
    },
    { titulo: 'Cargo', exemplo: 'Vendedora', regra: 'Sem cargo, o quadro fica incompleto para relatório.' },
    { titulo: 'Área', exemplo: 'Vendas' },
    {
      titulo: 'Matrícula',
      exemplo: '10432',
      regra:
        'Quando preenchida, é ela que identifica a pessoa — nome muda e homônimo existe. Duas linhas com a mesma matrícula contam como uma.',
    },
    {
      titulo: 'CPF',
      exemplo: '123.456.789-09',
      regra:
        'Com ou sem pontuação. CPF inválido bloqueia a linha, para o erro não ser descoberto meses depois na folha.',
    },
    {
      titulo: 'Data Admissão',
      exemplo: '03/02/2025',
      regra: 'Aceita 03/02/2025, 2025-02-03 ou o formato do Excel.',
    },
  ],
}

const MODELO_DESLIGAMENTOS: DefinicaoModelo = {
  tipo: 'desligamentos',
  nomeArquivo: 'modelo-desligamentos',
  titulo: 'Desligamentos',
  colunas: [
    COLUNA_UNIDADE,
    { titulo: 'Nome', obrigatoria: true, exemplo: 'João Lima' },
    {
      titulo: 'Data Desligamento',
      obrigatoria: true,
      exemplo: '14/06/2026',
      regra:
        'É ela que faz o registro existir. A mesma pessoa com datas diferentes entra duas vezes (recontratação).',
    },
    { titulo: 'Cargo', exemplo: 'Motorista' },
    { titulo: 'Área', exemplo: 'Distribuição Urbana' },
    { titulo: 'DPO ou SPO', exemplo: 'DPO', regra: 'DPO ou SPO.' },
    { titulo: 'Motivo', exemplo: 'Pedido de demissão', regra: 'Sem motivo, a análise de turnover fica cega.' },
  ],
}

const MODELO_PCD: DefinicaoModelo = {
  tipo: 'pcd',
  nomeArquivo: 'modelo-pcd',
  titulo: 'Gestão PCD',
  colunas: [
    COLUNA_UNIDADE,
    { titulo: 'Nome', obrigatoria: true, exemplo: 'Ana Paula Ferreira' },
    { titulo: 'Função', exemplo: 'Auxiliar Administrativo' },
    { titulo: 'Admissão', exemplo: '03/03/2025' },
    {
      titulo: 'Deficiência',
      exemplo: 'Auditiva',
      regra: 'Sem o tipo, o relatório de cota fica incompleto.',
    },
    { titulo: 'Tipo', exemplo: 'Permanente' },
    { titulo: 'Sexo', exemplo: 'Feminino' },
    { titulo: 'Cor', exemplo: 'Parda' },
  ],
}

const MODELO_APRENDIZES: DefinicaoModelo = {
  tipo: 'aprendizes',
  nomeArquivo: 'modelo-jovens-aprendizes',
  titulo: 'Jovens Aprendizes',
  colunas: [
    COLUNA_UNIDADE,
    { titulo: 'Nome', obrigatoria: true, exemplo: 'Lucas Andrade' },
    {
      titulo: 'Término Contrato',
      exemplo: '15/08/2027',
      regra: 'Sem esta data o contrato não entra no alerta de vencimento.',
    },
    { titulo: 'Início Contrato', exemplo: '16/08/2025' },
    { titulo: 'Admissão', exemplo: '16/08/2025' },
    { titulo: 'Data Nascimento', exemplo: '04/05/2007' },
    {
      titulo: 'Situação',
      exemplo: 'Vigente',
      regra: 'Vigente, Encerrado ou Desligado. Em branco vira Vigente.',
    },
    { titulo: 'Função', exemplo: 'Jovem Aprendiz' },
    { titulo: 'Departamento', exemplo: 'Vendas' },
    { titulo: 'Centro Custo', exemplo: '401' },
    { titulo: 'DPO ou SPO', exemplo: 'SPO', regra: 'DPO ou SPO.' },
    { titulo: 'Fundação', exemplo: 'CIEE' },
    { titulo: 'Horário', exemplo: '08:00 às 12:00' },
    { titulo: 'Gestor', exemplo: 'Marcos Augusto' },
    { titulo: 'Sexo', exemplo: 'Masculino' },
  ],
}

const MODELO_INTERNOS: DefinicaoModelo = {
  tipo: 'internos',
  nomeArquivo: 'modelo-candidatos-internos',
  titulo: 'Candidatos Internos',
  colunas: [
    COLUNA_UNIDADE,
    { titulo: 'Nome', obrigatoria: true, exemplo: 'Rafael Nunes' },
    { titulo: 'Cargo Atual', exemplo: 'Vendedor' },
    { titulo: 'Setor Atual', exemplo: 'Vendas' },
    { titulo: 'Cargo Pretendido', exemplo: 'Supervisor de Vendas' },
    { titulo: 'Tempo Função', exemplo: '2 anos' },
    { titulo: 'Avaliação Ciclo', exemplo: 'MUITO BOM' },
    {
      titulo: 'Possui Requisitos',
      exemplo: 'SIM',
      regra: 'SIM ou NÃO.',
    },
    { titulo: 'Matriz ou Filial', exemplo: 'MATRIZ' },
    {
      titulo: 'Situação',
      exemplo: 'AGUARDANDO',
      regra: 'Aguardando, Promovido, Não atende, Desligado ou Outra.',
    },
    {
      titulo: 'Futuros Cargos',
      exemplo: 'Supervisor de Vendas; Coordenador Comercial',
      regra: 'Separe por ponto e vírgula.',
    },
    { titulo: 'Observações', exemplo: '' },
  ],
}

/**
 * Espelha a aba "Plano de Sucessão" do arquivo do ciclo de gente do RH,
 * com os mesmos cabeçalhos — assim o modelo e a planilha que eles já usam
 * falam a mesma língua, e qualquer um dos dois é aceito na importação.
 */
const MODELO_SUCESSAO: DefinicaoModelo = {
  tipo: 'sucessao',
  nomeArquivo: 'modelo-pipeline-sucessao',
  titulo: 'Pipeline de Sucessão',
  colunas: [
    { ...COLUNA_UNIDADE, titulo: 'OPERAÇÃO' },
    { titulo: 'CARGO A SUCESSÃO', obrigatoria: true, exemplo: 'GERENTE DE DISTRIBUIÇÃO' },
    { titulo: 'ÁREA DO CARGO A SUCESSÃO', exemplo: 'DISTRIBUIÇÃO URBANA' },
    { titulo: 'NOME SUCESSOR', obrigatoria: true, exemplo: 'CARLA MENEZES' },
    { titulo: 'CARGO ATUAL DO SUCESSOR', exemplo: 'SUPERVISORA DE LOGÍSTICA' },
    {
      titulo: 'PRONTO AGORA?',
      exemplo: 'NÃO',
      regra: 'SIM, NÃO ou X. O sistema toma sempre o prazo mais próximo marcado.',
    },
    { titulo: 'PRONTO 1 ANO', exemplo: 'SIM', regra: 'SIM, NÃO ou X.' },
    { titulo: 'PRONTO 2 ANOS', exemplo: 'SIM', regra: 'SIM, NÃO ou X.' },
    { titulo: 'HABILIDADE TÉCNICA A POTENCIALIZAR OU DESENVOLVER', exemplo: 'Roteirização e OBZ' },
    { titulo: 'HABILIDADE COMPORTAMENTAL A POTENCIALIZAR OU DESENVOLVER', exemplo: 'Gestão de conflitos' },
    { titulo: 'PLANO DE DESENVOLVIMENTO', exemplo: 'Formação em gestão até 2027' },
    { titulo: 'ÍNICIO DO MAPEAMENTO', exemplo: '01/02/2026' },
    {
      titulo: 'STATUS',
      exemplo: 'ATIVO',
      regra: 'ATIVO ou DESLIGADO. Quem está desligado sai do pipeline.',
    },
    { titulo: 'HOUVE MOVIMENTAÇÃO', exemplo: 'NÃO', regra: 'SIM, NÃO ou X.' },
    { titulo: 'OBSERVAÇÃO', exemplo: 'CAPACITAR' },
    { titulo: 'MÊS / ANO', exemplo: 'ABRIL DE 2025' },
    { titulo: 'CICLO DE GENTE', exemplo: 'MUITO BOM' },
  ],
}

/**
 * Descrição de cargo — os cabeçalhos são os da planilha "Cargos e Perfil" que
 * o RH já mantém, na mesma ordem, para que o arquivo deles entre sem edição.
 *
 * É o único modelo **sem coluna de unidade**: o descritivo é da empresa, não
 * da operação. O padrão de "Analista de Controle" não muda entre Patos e Sumé.
 */
const MODELO_CARGOS: DefinicaoModelo = {
  tipo: 'cargos',
  nomeArquivo: 'modelo-descricao-de-cargo',
  titulo: 'Descrição de Cargo',
  colunas: [
    {
      titulo: 'Cargo',
      obrigatoria: true,
      exemplo: 'Analista de Controle',
      regra: 'Cargo e Área juntos identificam o descritivo. Reimportar o mesmo par atualiza o que já existe, em vez de duplicar.',
    },
    {
      titulo: 'Área',
      obrigatoria: true,
      exemplo: 'Logística',
      regra: 'Obrigatória: dois cargos de mesmo nome em áreas diferentes são dois descritivos.',
    },
    {
      titulo: 'Tipo vaga',
      exemplo: 'Demais cargos',
      regra: 'Operacional, Demais cargos ou Liderança.',
    },
    {
      titulo: 'Descrição Atividades',
      exemplo: 'Controle de informações sobre faturamento; emissão de notas; controle de vencimento de produtos.',
      regra: 'É o campo que a comparação de aderência usa. Sem ele o cargo importa, mas com aviso.',
    },
    {
      titulo: 'Competências Sugeridas',
      exemplo: 'Capacidade analítica\nOrganização\nSenso de urgência',
      regra: 'Pode ser multilinha — uma competência por linha, como na planilha do RH.',
    },
    { titulo: 'Experiência Sugerida', exemplo: '6 meses na área' },
    { titulo: 'Formação', exemplo: 'Ensino Superior', regra: 'O nível exigido.' },
    { titulo: 'Status', exemplo: 'Formado', regra: 'A situação do curso: Formado, Cursando, Completo ou em andamento.' },
    {
      titulo: 'Curso',
      exemplo: 'Administração, Contábeis ou áreas afins',
      regra: 'Qual curso, quando o cargo pede um específico. Diferente de Formação (o nível) e de Status (a situação).',
    },
    { titulo: 'Exigências', exemplo: 'Obrigatório: conhecimento em Pacote Office' },
    { titulo: 'Observações', exemplo: 'Desejável experiência em bens de consumo' },
    {
      titulo: 'Precisa ter aderência ao Raio?',
      exemplo: 'Sim',
      regra: 'Sim, Não ou X. Vazio conta como Não.',
    },
    {
      titulo: 'Etapas do Processo',
      exemplo: 'Triagem\nTestes\nEntrevista (1 e 2)\nASO',
      regra: 'Pode ser multilinha — uma etapa por linha.',
    },
    { titulo: 'Testes', exemplo: 'Lógica\nExcel\nMatemática Intermediário' },
  ],
}

export const MODELOS: Record<TipoModelo, DefinicaoModelo> = {
  vagas: MODELO_VAGAS,
  candidatos: MODELO_CANDIDATOS,
  quadro: MODELO_QUADRO,
  desligamentos: MODELO_DESLIGAMENTOS,
  pcd: MODELO_PCD,
  aprendizes: MODELO_APRENDIZES,
  internos: MODELO_INTERNOS,
  sucessao: MODELO_SUCESSAO,
  cargos: MODELO_CARGOS,
}

export function ehTipoModelo(valor: unknown): valor is TipoModelo {
  return typeof valor === 'string' && (TIPOS_MODELO as readonly string[]).includes(valor)
}

/**
 * Linha de exemplo do modelo, no formato que o importador recebe.
 * Usada tanto para gerar a planilha quanto pelo teste de coerência.
 */
export function linhaExemplo(modelo: DefinicaoModelo): Record<string, string> {
  return Object.fromEntries(modelo.colunas.map((c) => [c.titulo, c.exemplo]))
}
