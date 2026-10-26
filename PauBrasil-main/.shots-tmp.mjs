import { chromium } from 'playwright'
const out = process.argv[2]
const b = await chromium.launch()
const rotas = ['/', '/nossa-gente', '/newsletter', '/universidade-pb', '/empresas/bebidas', '/carreiras', '/contato']
for (const rota of rotas) for (const w of [1440, 900, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' })
  await p.goto('http://localhost:3000' + rota, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  // pausa carrosséis e trava estado para comparação estável
  await p.evaluate(() => { document.querySelectorAll('[data-news-toggle],[data-era-toggle]').forEach(b => b.click()); window.scrollTo(0, document.body.scrollHeight); })
  await p.waitForTimeout(800); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800)
  await p.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}' })
  await p.screenshot({ path: `${out}/${rota.replace(/\//g, '_') || '_'}-${w}.png`, fullPage: true })
  await p.close()
}
await b.close()
