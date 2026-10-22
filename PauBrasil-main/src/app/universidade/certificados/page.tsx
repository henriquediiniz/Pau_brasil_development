'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Loader2, Download, Check } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import QRCode from 'qrcode'

interface Certificado {
  id: string
  emitidoEm: string
  temporada: { id: string; titulo: string; descricao: string | null; capa: string | null }
  user?: { name: string; function?: { name: string } | null }
}

function pad(n: number) { return String(n).padStart(2, '0') }

function certCode(id: string) {
  return `UPB-${id.slice(0, 4).toUpperCase()}-${id.slice(4, 8).toUpperCase()}-${id.slice(-4).toUpperCase()}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function CertificadosPage() {
  const { data: session } = useSession()
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [functionName, setFunctionName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/universidade/certificados')
      .then(r => r.json())
      .then(data => {
        setCertificados(Array.isArray(data.certificados) ? data.certificados : [])
        setFunctionName(data.functionName ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleDownload(cert: Certificado) {
    setDownloading(cert.id)
    try {
      const user = session?.user
      const userName  = user?.name ?? 'Colaborador'
      const userCargo = functionName ?? ''
      const code      = certCode(cert.id)
      const dateStr   = formatDate(cert.emitidoEm)
      const verifyUrl = `${window.location.origin}/universidade/certificados`

      const [qrDataUrl, logoDataUrl] = await Promise.all([
        QRCode.toDataURL(verifyUrl, {
          width: 100, margin: 1,
          color: { dark: '#7c5c1e', light: '#fffdf5' },
        }),
        fetch('/logos/grupo pau brasil.png')
          .then(r => r.blob())
          .then(blob => new Promise<string>((res, rej) => {
            const reader = new FileReader()
            reader.onload = () => res(reader.result as string)
            reader.onerror = rej
            reader.readAsDataURL(blob)
          }))
          .catch(() => ''),
      ])

      const html = buildCertHTML({ userName, userCargo, cert, code, dateStr, qrDataUrl, logoDataUrl })

      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.write(html)
        iframeDoc.close()
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            setTimeout(() => document.body.removeChild(iframe), 10000)
          }, 400)
        }
      }
      
      // Feedback de Sucesso Efêmero
      setDownloadSuccess(cert.id)
      setTimeout(() => setDownloadSuccess(null), 2500)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-white/5 border border-white/10 rounded-xl mb-2" />
        <div className="h-4 w-32 bg-white/5 rounded-lg" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-white/5 rounded-md" />
              <div className="h-3 w-32 bg-white/5 rounded-md" />
              <div className="h-3 w-40 bg-white/5 rounded-md mt-1" />
            </div>
            <div className="w-32 h-10 rounded-xl bg-white/5 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Award className="w-6 h-6 text-brand-400" />
          <h1 className="text-2xl font-display font-bold text-white">Meus Certificados</h1>
        </div>
        <p className="text-slate-400 text-sm">
          {certificados.length} certificado{certificados.length !== 1 ? 's' : ''} emitido{certificados.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {certificados.length === 0 ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-12 text-center">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">Nenhum certificado ainda.</p>
          <Link href="/universidade" className="text-brand-400 text-sm hover:underline">
            Ir para a Universidade →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {certificados.map((cert, i) => (
            <motion.div key={cert.id} layout
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-white/3 border border-white/8 hover:border-white/12 transition-all p-5 flex items-center gap-4">

              {/* Ícone */}
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-amber-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold leading-snug">{cert.temporada.titulo}</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Emitido em {formatDate(cert.emitidoEm)}
                </p>
                <p className="text-slate-600 text-xs mt-1 font-mono">{certCode(cert.id)}</p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(cert)}
                  disabled={downloading === cert.id}
                  aria-busy={downloading === cert.id}
                  className="relative flex items-center justify-center gap-1.5 px-3.5 py-2 w-32 rounded-xl gradient-brand text-white text-xs font-semibold shadow shadow-brand-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d14] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  <AnimatePresence mode="wait">
                    {downloading === cert.id ? (
                      <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex items-center gap-1.5 absolute">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Gerando...</span>
                      </motion.div>
                    ) : downloadSuccess === cert.id ? (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex items-center gap-1.5 absolute">
                        <Check className="w-3.5 h-3.5 text-[#f0dfb0]" />
                        <span>Pronto!</span>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex items-center gap-1.5 absolute">
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar PDF</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Template HTML do certificado ────────────────────────────────────────────
function buildCertHTML(p: {
  userName: string
  userCargo: string
  cert: Certificado
  code: string
  dateStr: string
  qrDataUrl: string
  logoDataUrl: string
}) {
  const { userName, userCargo, cert, code, dateStr, qrDataUrl, logoDataUrl } = p

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Certificado — ${cert.temporada.titulo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 297mm; height: 210mm;
      margin: 0; padding: 0;
      background: #1a1200;
    }

    .cert {
      width: 297mm; height: 210mm;
      background: #fffdf5;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Faixa superior dourada */
    .header-bar {
      background: linear-gradient(135deg, #7c4d00 0%, #b87000 40%, #e8a000 70%, #b87000 100%);
      height: 22mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14mm;
      position: relative;
    }
    .header-bar::after {
      content: '';
      position: absolute;
      bottom: -3px; left: 0; right: 0;
      height: 6px;
      background: linear-gradient(90deg, transparent, rgba(255,200,50,0.4), transparent);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.4);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .brand-text { color: #fff; }
    .brand-name {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .brand-sub {
      font-family: 'Inter', sans-serif;
      font-size: 8px;
      font-weight: 300;
      letter-spacing: 1.5px;
      opacity: 0.8;
      text-transform: uppercase;
    }
    .header-title {
      font-family: 'Playfair Display', serif;
      font-size: 11px;
      color: rgba(255,255,255,0.85);
      letter-spacing: 4px;
      text-transform: uppercase;
      font-style: italic;
    }

    /* Corpo */
    .body {
      flex: 1;
      padding: 12mm 16mm 10mm;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Marca d'água */
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 65mm;
      opacity: 0.12;
      pointer-events: none;
      filter: grayscale(1);
      z-index: 1;
    }

    /* Ornamentos de canto — position:absolute preservado */
    .corner {
      position: absolute !important;
      width: 28mm; height: 28mm;
      opacity: 0.12;
      z-index: 2;
    }
    .corner svg { width: 100%; height: 100%; }
    .corner-tl { top: 4mm; left: 4mm; }
    .corner-tr { top: 4mm; right: 4mm; transform: scaleX(-1); }
    .corner-bl { bottom: 4mm; left: 4mm; transform: scaleY(-1); }
    .corner-br { bottom: 4mm; right: 4mm; transform: scale(-1); }

    /* Wrapper do conteúdo textual — fica acima da marca d'água */
    .content {
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .certifica-label {
      font-family: 'Inter', sans-serif;
      font-size: 7.5px;
      font-weight: 500;
      letter-spacing: 3px;
      color: #9a7520;
      text-transform: uppercase;
      margin-bottom: 3mm;
    }

    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-size: 34px;
      color: #1a1200;
      line-height: 1.1;
      margin-bottom: 2mm;
    }

    .recipient-cargo {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: 400;
      color: #9a7520;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 6mm;
    }

    .divider {
      width: 60mm;
      height: 1.5px;
      background: linear-gradient(90deg, #c8860a, #e8a000, #c8860a);
      margin-bottom: 6mm;
    }

    .course-label {
      font-family: 'Inter', sans-serif;
      font-size: 7.5px;
      font-weight: 500;
      letter-spacing: 2.5px;
      color: #aaa;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }

    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      color: #2d1f00;
      margin-bottom: 2mm;
      line-height: 1.3;
    }

    .course-desc {
      font-family: 'Inter', sans-serif;
      font-size: 8.5px;
      font-weight: 300;
      color: #888;
      line-height: 1.6;
      max-width: 160mm;
    }

    /* Rodapé */
    .footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 6mm;
      border-top: 1px solid #e8d9b0;
    }

    .sig-block {
      display: flex;
      gap: 16mm;
    }
    .sig {
      text-align: center;
    }
    .sig-line {
      width: 42mm;
      height: 1px;
      background: #c8a050;
      margin-bottom: 2mm;
    }
    .sig-name {
      font-family: 'Inter', sans-serif;
      font-size: 7.5px;
      font-weight: 600;
      color: #444;
      letter-spacing: 0.5px;
    }
    .sig-role {
      font-family: 'Inter', sans-serif;
      font-size: 6.5px;
      color: #aaa;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    .meta-block {
      text-align: right;
    }
    .meta-date {
      font-family: 'Inter', sans-serif;
      font-size: 7.5px;
      color: #666;
      margin-bottom: 1mm;
    }
    .meta-code {
      font-family: 'Inter', sans-serif;
      font-size: 6.5px;
      color: #bbb;
      letter-spacing: 1px;
      margin-bottom: 3mm;
    }

    .qr-wrap {
      display: flex;
      align-items: center;
      gap: 3mm;
    }
    .qr-wrap img {
      width: 18mm; height: 18mm;
      border: 1px solid #e0cc90;
      border-radius: 3px;
      padding: 1px;
      background: #fffdf5;
    }
    .qr-label {
      font-family: 'Inter', sans-serif;
      font-size: 6px;
      color: #bbb;
      letter-spacing: 0.5px;
      max-width: 20mm;
      line-height: 1.4;
    }

    /* Faixa inferior */
    .footer-bar {
      height: 4mm;
      background: linear-gradient(90deg, #7c4d00, #b87000, #e8a000, #b87000, #7c4d00);
    }

    @media print {
      html, body { margin: 0; padding: 0; background: transparent; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4 landscape; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <!-- Cabeçalho dourado -->
    <div class="header-bar">
      <div class="brand">
        <div class="brand-icon">P</div>
        <div class="brand-text">
          <div class="brand-name">Grupo Pau Brasil</div>
          <div class="brand-sub">Universidade Corporativa</div>
        </div>
      </div>
      <div class="header-title">Certificado de Conclusão</div>
    </div>

    <!-- Corpo -->
    <div class="body">
      <!-- Marca d'água -->
      ${logoDataUrl ? `<img class="watermark" src="${logoDataUrl}" alt=""/>` : ''}

      <!-- Ornamentos -->
      <div class="corner corner-tl">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5 L5 50 M5 5 L50 5" stroke="#8B6914" stroke-width="3"/>
          <path d="M15 5 L15 20 M5 15 L20 15" stroke="#8B6914" stroke-width="1.5"/>
          <circle cx="5" cy="5" r="4" fill="#8B6914"/>
          <path d="M25 5 C25 25 5 25 5 45" stroke="#8B6914" stroke-width="1" fill="none"/>
        </svg>
      </div>
      <div class="corner corner-tr">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5 L5 50 M5 5 L50 5" stroke="#8B6914" stroke-width="3"/>
          <path d="M15 5 L15 20 M5 15 L20 15" stroke="#8B6914" stroke-width="1.5"/>
          <circle cx="5" cy="5" r="4" fill="#8B6914"/>
          <path d="M25 5 C25 25 5 25 5 45" stroke="#8B6914" stroke-width="1" fill="none"/>
        </svg>
      </div>
      <div class="corner corner-bl">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5 L5 50 M5 5 L50 5" stroke="#8B6914" stroke-width="3"/>
          <path d="M15 5 L15 20 M5 15 L20 15" stroke="#8B6914" stroke-width="1.5"/>
          <circle cx="5" cy="5" r="4" fill="#8B6914"/>
          <path d="M25 5 C25 25 5 25 5 45" stroke="#8B6914" stroke-width="1" fill="none"/>
        </svg>
      </div>
      <div class="corner corner-br">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5 L5 50 M5 5 L50 5" stroke="#8B6914" stroke-width="3"/>
          <path d="M15 5 L15 20 M5 15 L20 15" stroke="#8B6914" stroke-width="1.5"/>
          <circle cx="5" cy="5" r="4" fill="#8B6914"/>
          <path d="M25 5 C25 25 5 25 5 45" stroke="#8B6914" stroke-width="1" fill="none"/>
        </svg>
      </div>

      <div class="content">
        <div class="certifica-label">Certificamos que</div>
        <div class="recipient-name">${userName}</div>
        ${userCargo ? `<div class="recipient-cargo">${userCargo}</div>` : '<div style="margin-bottom:6mm"></div>'}
        <div class="divider"></div>
        <div class="course-label">Concluiu com êxito o programa</div>
        <div class="course-name">${cert.temporada.titulo}</div>
        <div class="course-desc">${cert.temporada.descricao || 'Programa de Desenvolvimento Interno — Universidade Pau Brasil'}</div>

        <!-- Rodapé -->
        <div class="footer">
        <div class="sig-block">
          <div class="sig">
            <div class="sig-line"></div>
            <div class="sig-name">Departamento de Pessoas</div>
            <div class="sig-role">Grupo Pau Brasil</div>
          </div>
          <div class="sig">
            <div class="sig-line"></div>
            <div class="sig-name">Universidade Pau Brasil</div>
            <div class="sig-role">Coordenação Acadêmica</div>
          </div>
        </div>

        <div class="meta-block">
          <div class="meta-date">Emitido em ${dateStr}</div>
          <div class="meta-code">${code}</div>
          <div class="qr-wrap" style="justify-content:flex-end">
            <div class="qr-label">Verificação de<br/>autenticidade</div>
            <img src="${qrDataUrl}" alt="QR verificação"/>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- Rodapé dourado -->
    <div class="footer-bar"></div>
  </div>
</body>
</html>`
}
