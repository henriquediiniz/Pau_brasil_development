/*
 * Service worker do portal, escrito à mão (substitui o next-pwa em out/2026).
 *
 * Faz só o necessário:
 *  - notificações push (assinatura feita em /app/perfil, envio por web-push);
 *  - página offline embutida quando uma navegação falha sem internet.
 *
 * Não guarda páginas nem APIs em cache: o navegador já cuida dos arquivos
 * estáticos do Next (imutáveis por hash), e cache de página gerava dado velho.
 * Ao ativar, apaga os caches que o next-pwa deixou nos aparelhos.
 */
const VERSAO = 'pb-sw-2026-10-26'

const OFFLINE_HTML = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sem conexão · Grupo Pau Brasil</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf9f6;color:#1a1a1a;font-family:Montserrat,Arial,sans-serif;padding:24px;box-sizing:border-box}
  main{text-align:center;max-width:360px}
  span{display:block;font-size:12px;font-weight:600;letter-spacing:.17em;text-transform:uppercase;color:#7a1520}
  h1{margin:16px 0 10px;font-size:28px;font-weight:600;letter-spacing:-.04em}
  p{margin:0;font-size:14px;line-height:1.7;color:#6f5c4e}
  button{margin-top:26px;padding:14px 22px;border:0;border-radius:3px;background:#7a1520;color:#fff;font:600 14px Montserrat,Arial,sans-serif;cursor:pointer}
</style></head>
<body><main><span>Grupo Pau Brasil</span><h1>Sem conexão</h1>
<p>Você está offline. Verifique sua conexão com a internet e tente novamente.</p>
<button onclick="location.reload()">Tentar novamente</button></main></body></html>`

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  )
})

// Só navegações: se a rede falhar, mostra a página offline. O resto segue direto para a rede.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    ),
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Pau Brasil', body: event.data.text() }
  }

  const { title = 'Pau Brasil', body = '', url = '/', icon = '/icons/icon-192.png' } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icons/icon-96.png',
      data: { url },
      vibrate: [100, 50, 100],
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if (cliente.url.includes(self.location.origin) && 'focus' in cliente) {
          cliente.navigate(url)
          return cliente.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})

// Referência para quem inspecionar o worker no navegador.
self.VERSAO_SW = VERSAO
