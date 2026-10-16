const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
             'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export interface CvExtracted {
  nome:       string
  email:      string
  telefone:   string
  cidade:     string
  estado:     string
  cargosRec:  string[]
}

export function extractCvData(text: string): CvExtracted {
  // ── Email + telefone colado + cidade colada ──────────────────────────────────
  const squashedRx = /(?:(\d{8,11}))?([a-zA-Z._-]+[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.(?:com\.br|com|net|org|edu|gov|br|io|co))([A-ZÀ-ÿa-z][a-zA-ZÀ-ÿ\s-]*)?/i
  const sq = text.match(squashedRx)

  let email    = ''
  let phoneStr = ''
  let cidade   = ''

  if (sq) {
    phoneStr = sq[1] ?? ''
    email    = sq[2] ?? ''
    if (sq[3]) {
      const c = sq[3].split('-')[0].trim()
      if (c.length >= 3) cidade = c
    }
  } else {
    const em = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)
    email = em?.[0] ?? ''
  }

  // ── Telefone ─────────────────────────────────────────────────────────────────
  let telefone = ''
  if (phoneStr && phoneStr.length >= 8) {
    telefone = phoneStr
  } else {
    const pRx = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-\s]?\d{4}/g
    for (const p of text.match(pRx) ?? []) {
      const d = p.replace(/[^\d+]/g, '')
      if (d.length >= 8 && d.length <= 13) { telefone = d; break }
    }
  }
  if (telefone.length === 8) telefone = '839' + telefone
  else if (telefone.length === 9) telefone = '83' + telefone

  // ── Nome ─────────────────────────────────────────────────────────────────────
  const skipRx = /curr(i|í)culo|curriculum|vitae|dados|perfil|resumo|objetivo|brasileiro|solteiro|casado|estudante|bacharelado|experi[êe]ncia|forma[çc][ãa]o|habilidad|oportunidade/i
  const lines  = text.split('\n').map(l => l.trim()).filter(Boolean)
  let nome = ''

  for (const line of lines) {
    const words = line.split(/\s+/)
    if (/[.,:()|@]/.test(line)) continue
    if (skipRx.test(line)) continue
    if (line === line.toUpperCase() && words.length >= 2 && words.length <= 6 && line.length < 60) {
      nome = line.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase())
      break
    }
  }
  if (!nome) {
    for (const line of lines) {
      const words = line.split(/\s+/)
      if (/[.,:()|@]/.test(line)) continue
      if (skipRx.test(line)) continue
      if (words.length >= 2 && words.length <= 6 && line.length < 60) {
        const caps = words.filter(w => w[0] === w[0]?.toUpperCase())
        if (caps.length >= words.length / 2) {
          nome = line.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase())
          break
        }
      }
    }
  }

  // ── Estado ───────────────────────────────────────────────────────────────────
  let estado = ''
  for (const uf of UFS) {
    if (new RegExp(`\\b${uf}\\b`).test(text)) { estado = uf; break }
  }

  // ── Sugestão de cargos por palavras-chave ────────────────────────────────────
  const t = text.toLowerCase()
  const cargosRec: string[] = []
  if (/venda|comercial|vendedor|representante|metas/.test(t))
    cargosRec.push('Gerente de Vendas', 'Supervisor de Nível de Serviço')
  if (/financeiro|cont[aá]bil|finan[çc]as|tesouraria|faturamento/.test(t))
    cargosRec.push('Coord. Financeiro', 'Auxiliar Financeiro')
  if (/log[íi]stica|armazém|estoque|frota|caminhão/.test(t))
    cargosRec.push('Coord. de Armazém', 'Coord. de Frota', 'Gerente de Operações e Distribuição')
  if (/gente|rh|recursos humanos|psicologia|recrutamento|treinamento/.test(t))
    cargosRec.push('Coord. de Gente', 'Analista de Gente')
  if (/tecnologia|\bti\b|suporte|sistemas|desenvolvedor|programador/.test(t))
    cargosRec.push('Analista de TI')

  return { nome, email, telefone, cidade, estado, cargosRec: Array.from(new Set(cargosRec)).slice(0, 3) }
}
