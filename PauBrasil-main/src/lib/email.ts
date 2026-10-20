import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Portal Pau Brasil <onboarding@resend.dev>'
const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

/** Envia um e-mail via Resend. Retorna silenciosamente em caso de falha (não quebra o fluxo principal). */
export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return // e-mail desabilitado — RESEND_API_KEY não configurado

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[email] falha ao enviar para', to, err)
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

function base(title: string, body: string) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:#16a34a;padding:24px 32px">
          <span style="color:#fff;font-size:20px;font-weight:700">🌿 Grupo Pau Brasil — OBZ Portal</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <h2 style="margin:0 0 16px;color:#111827;font-size:18px">${title}</h2>
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#6b7280;font-size:12px">
            Este é um e-mail automático do OBZ Portal. Não responda a esta mensagem.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${text}</a>`
}

// ─── Template: Boas-vindas (conta criada) ────────────────────────────────────

export function emailBoasVindas(opts: {
  nome: string
  email: string
  setupUrl: string
}) {
  const { nome, email, setupUrl } = opts
  const body = `
    <p style="color:#374151">Olá, <strong>${nome}</strong>! 👋</p>
    <p style="color:#374151">
      Sua conta no <strong>Portal do Grupo Pau Brasil</strong> foi criada com sucesso.
    </p>
    <p style="color:#374151"><strong>E-mail de acesso:</strong> ${email}</p>
    <p style="color:#374151">
      Clique no botão abaixo para definir sua senha e acessar o portal.
      O link é válido por <strong>7 dias</strong>.
    </p>
    ${btn('Definir minha senha', setupUrl)}
    <p style="margin-top:24px;color:#9ca3af;font-size:12px">
      Se você não esperava este e-mail, ignore-o com segurança.
    </p>
  `
  return {
    subject: '🌿 Bem-vindo(a) ao Portal Grupo Pau Brasil',
    html: base('Sua conta está pronta!', body),
  }
}

// ─── Template: Formulário de Contato ──────────────────────────────────────────

export function emailContatoRecebido(opts: {
  nome: string
  email: string
  assunto: string
  mensagem: string
}) {
  const { nome, email, assunto, mensagem } = opts
  const body = `
    <p style="color:#374151">Nova mensagem recebida pelo formulário de contato do site:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:80px">Nome</td>
          <td style="padding:8px 0;color:#111827;font-weight:600">${nome}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">E-mail</td>
          <td style="padding:8px 0;color:#111827"><a href="mailto:${email}" style="color:#16a34a">${email}</a></td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Assunto</td>
          <td style="padding:8px 0;color:#111827">${assunto}</td></tr>
    </table>
    <div style="background:#f9fafb;border-left:3px solid #16a34a;padding:16px;border-radius:4px;margin-top:8px">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap">${mensagem}</p>
    </div>
    ${btn('Responder', `mailto:${email}`)}
  `
  return {
    subject: `[Contato] ${assunto} — ${nome}`,
    html: base('Nova mensagem de contato', body),
  }
}
