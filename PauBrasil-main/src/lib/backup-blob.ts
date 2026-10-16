import { put, list, del } from '@vercel/blob'

export interface BlobMeta {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
}

export async function uploadBackup(buffer: Buffer, suffix: string): Promise<BlobMeta> {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + 'Z'
  const filename = `backups/backup_${ts}_${suffix}.json.gz`

  const blob = await put(filename, buffer, {
    access: 'private',
    contentType: 'application/gzip',
    addRandomSuffix: false,
  })

  return { url: blob.url, pathname: blob.pathname, size: buffer.length, uploadedAt: new Date() }
}

export async function listBackups(): Promise<BlobMeta[]> {
  const { blobs } = await list({ prefix: 'backups/' })
  return blobs.map(b => ({
    url: b.url,
    pathname: b.pathname,
    size: b.size,
    uploadedAt: b.uploadedAt,
  }))
}

export async function deleteBackup(pathname: string): Promise<void> {
  await del(pathname)
}
