import { NextRequest, NextResponse } from "next/server"
import { parseCvRatelimit } from '@/lib/rate-limit'

function extractData(text: string) {
  // Regex aprimorado que separa telefone colado do email, e captura possível Cidade no final
  const squashedRegex = /(?:(\d{8,11}))?([a-zA-Z._-]+[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.(?:com\.br|com|net|org|edu|gov|br|io|co))([A-ZÀ-ÿa-z][a-zA-ZÀ-ÿ\s-]*)?/i
  const match = text.match(squashedRegex)
  
  let email = ""
  let phoneStr = ""
  let cidade = ""
  
  if (match) {
    phoneStr = match[1] || ""
    email = match[2]
    if (match[3]) {
      const parsedCity = match[3].split('-')[0].trim()
      if (parsedCity.length >= 3) cidade = parsedCity
    }
  } else {
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)
    email = emailMatch ? emailMatch[0] : ""
  }
  
  let phone = ""
  if (phoneStr && phoneStr.length >= 8) {
     phone = phoneStr;

  } else {
    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-\s]?\d{4}/g
    const phoneMatches = text.match(phoneRegex)
    if (phoneMatches && phoneMatches.length > 0) {
      // Pegar o primeiro numero que parece válido
      for (const p of phoneMatches) {
          const digits = p.replace(/[^\d+]/g, '')
          // Aceita 10 a 13 digitos, ou se for algo como 9 ou 8
          if (digits.length >= 8 && digits.length <= 13) {
              phone = digits
              break
          }
      }
    }
  }

  // Se o telefone foi extraído mas está sem DDD, adicionamos o DDD primário da empresa
  if (phone) {
    if (phone.length === 8) phone = "839" + phone;
    else if (phone.length === 9) phone = "83" + phone;
  }

  // Nome heurística avançada: procura linhas sem pontuação e sem palavras de seção
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let name = ""
  
  // Tentar primeiro linhas em ALL CAPS que geralmente são os nomes de destaque
  for (const line of lines) {
    const isCommonHeader = /curr(i|í)culo|curriculum|vitae|dados|perfil|resumo|objetivo|brasileiro|solteiro|casado|estudante|bacharelado|experi[êe]ncia|forma[çc][ãa]o|habilidad/i.test(line)
    const words = line.split(/\s+/)
    if (line.includes('.') || line.includes(',') || line.includes(':') || line.includes('-') || line.includes('(') || line.includes('|') || line.includes('@')) continue;

    const isAllCaps = line === line.toUpperCase();
    if (isAllCaps && words.length >= 2 && words.length <= 6 && line.length < 60 && !isCommonHeader) {
      name = line.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
      break
    }
  }

  // Falback para linhas em Title Case
  if (!name) {
    for (const line of lines) {
      const isCommonHeader = /curr(i|í)culo|curriculum|vitae|dados|perfil|resumo|objetivo|brasileiro|solteiro|casado|estudante|bacharelado|experi[êe]ncia|forma[çc][ãa]o|habilidad|oportunidade/i.test(line)
      const words = line.split(/\s+/)
      
      if (line.includes('.') || line.includes(',') || line.includes(':') || line.includes('-') || line.includes('(') || line.includes('|') || line.includes('@')) continue;

      if (words.length >= 2 && words.length <= 6 && line.length < 60 && !isCommonHeader) {
        const titleCaseWords = words.filter(w => w[0] === w[0].toUpperCase())
        if (titleCaseWords.length >= words.length / 2) {
          name = line.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
          break
        }
      }
    }
  }
  
  // Tentar encontrar o estado
  let estado = ""
  const ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
  for (const uf of ufs) {
    // Regex buscando a sigla do estado separada por bordas (ex: - PB, ou PB -)
    const rx = new RegExp(`\\b${uf}\\b`, 'g')
    if (rx.test(text)) {
      estado = uf
      break
    }
  }

  // Recomendações baseadas em palavras-chave no currículo
  const skillsText = text.toLowerCase()
  const cargosRec: string[] = []
  
  if (skillsText.match(/venda|comercial|vendedor|representante|metas/)) cargosRec.push('Gerente de Vendas', 'Supervisor de Nível de Serviço')
  if (skillsText.match(/financeiro|contábil|finanças|tesouraria|faturamento/)) cargosRec.push('Coord. Financeiro', 'Auxiliar Financeiro')
  if (skillsText.match(/log[íi]stíca|armazém|estoque|frota|caminhão/)) cargosRec.push('Coord. de Armazém', 'Coord. de Frota', 'Coord. da Distribuição', 'Gerente de Operações e Distribuição')
  if (skillsText.match(/gente|rh|recursos humanos|psicologia|recrutamento|treinamento/)) cargosRec.push('Coord. de Gente', 'Analista de Gente')
  if (skillsText.match(/tecnologia|ti|suporte|sistemas|desenvolvedor|programador/)) cargosRec.push('Analista de TI')

  return { name, email, phone, estado, cidade, cargosRec: Array.from(new Set(cargosRec)).slice(0, 3) }
}

export async function POST(req: NextRequest) {
  try {
    if (parseCvRatelimit) {
      const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
      const { success } = await parseCvRatelimit.limit(ip)
      if (!success) {
        return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 10 minutos." }, { status: 429 })
      }
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

    // Converter file para Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Extrai o texto focado no PDF
    const pdfParse = require('pdf-parse')
    const parseFunc = pdfParse.PDFParse || pdfParse
    const pdfData = await parseFunc(buffer)
    const text = pdfData.text

    const extracted = extractData(text)

    return NextResponse.json({ 
        success: true, 
        ...extracted
    })
  } catch (err: any) {
    console.error("Erro no parser de CV:", err)
    return NextResponse.json({ error: "Falha ao ler o PDF do currículo." }, { status: 500 })
  }
}
