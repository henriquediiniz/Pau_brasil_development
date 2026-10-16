// Custom service worker code — merged into sw.js by next-pwa

// ── Background sync: check-in offline queue ──────────────────────────────────
const CHECKIN_DB = 'pb-checkin-queue'
const CHECKIN_STORE = 'pending'

function openCheckinDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CHECKIN_DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(CHECKIN_STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

self.addEventListener('sync', event => {
  if (event.tag !== 'checkin-queue') return
  event.waitUntil(flushCheckinQueue())
})

async function flushCheckinQueue() {
  const db = await openCheckinDB()
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_STORE, 'readonly')
    const req = tx.objectStore(CHECKIN_STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  for (const item of items) {
    try {
      const res = await fetch('/api/visitas/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationSlug: item.operationSlug,
          latitude: item.latitude,
          longitude: item.longitude,
          photoBase64: item.photoBase64,
          faceValid: item.faceValid,
        }),
      })
      if (res.ok || res.status === 409 || res.status === 429) {
        // 409 = duplicate (already registered), 429 = rate limited → remove from queue
        await new Promise((resolve, reject) => {
          const tx = db.transaction(CHECKIN_STORE, 'readwrite')
          tx.objectStore(CHECKIN_STORE).delete(item.id)
          tx.oncomplete = resolve
          tx.onerror = reject
        })
        if (res.ok) {
          self.registration.showNotification('Pau Brasil', {
            body: 'Check-in enviado com sucesso!',
            icon: '/icons/icon-192.png',
          })
        }
      }
    } catch {
      // Network error: keep in queue for next sync
    }
  }
}

self.addEventListener('push', event => {
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
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
