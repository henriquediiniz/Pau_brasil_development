const DB_NAME = 'pb-checkin-queue'
const STORE = 'pending'
const DB_VERSION = 1

export interface PendingCheckin {
  id: string
  operationSlug: string
  latitude: number
  longitude: number
  photoBase64: string
  faceValid: boolean
  queuedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueCheckin(payload: Omit<PendingCheckin, 'id' | 'queuedAt'>): Promise<string> {
  const db = await openDB()
  const item: PendingCheckin = { ...payload, id: crypto.randomUUID(), queuedAt: Date.now() }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add(item)
    tx.oncomplete = () => resolve(item.id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingCheckins(): Promise<PendingCheckin[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function removeCheckin(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
