import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const from = process.env.EMAIL_FROM ?? 'OBZ Portal <onboarding@resend.dev>'
const to = process.env.EMAIL_ADMIN ?? 'txiago123@gmail.com'

async function main() {
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY não configurado no .env')
    process.exit(1)
  }

  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: '✅ Teste de email — Portal Pau Brasil',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;padding:32px;background:#f4f4f5">
        <div style="background:#fff;border-radius:12px;padding:32px;max-width:480px;margin:0 auto">
          <h2 style="color:#16a34a;margin:0 0 16px">🌿 Email funcionando!</h2>
          <p style="color:#374151">Este é um email de teste do Portal Pau Brasil.</p>
          <p style="color:#6b7280;font-size:13px">Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    `,
  })

  if (error) {
    console.error('❌ Erro ao enviar:', error)
    process.exit(1)
  }

  console.log('✅ Email enviado com sucesso! ID:', data?.id)
  console.log('   De:', from)
  console.log('   Para:', to)
}

main()
