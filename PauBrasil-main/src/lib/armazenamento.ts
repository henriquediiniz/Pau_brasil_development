/**
 * Armazenamento de arquivos no Vercel Blob **privado**.
 *
 * Currículos, laudos e imagens enviadas pelo portal ficam aqui. Arquivo privado
 * não abre pela URL: toda leitura passa pelo `get` do SDK, que assina a
 * requisição com o `BLOB_READ_WRITE_TOKEN`. Por isso quem entrega o arquivo é
 * sempre uma rota do portal, que decide quem pode ver.
 *
 * Substitui o Cloudinary (out/2026): produção nunca teve as credenciais, e o
 * envio de currículos falhava para todo candidato.
 */

import { randomUUID } from 'crypto'
import { del, get, put } from '@vercel/blob'
import { z } from 'zod'

export function armazenamentoConfigurado(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export const MENSAGEM_SEM_ARMAZENAMENTO = 'Armazenamento de arquivos não configurado'

export async function salvarPrivado(chave: string, dados: Buffer | Blob, contentType: string) {
  const blob = await put(chave, dados, { access: 'private', contentType, addRandomSuffix: false })
  return { chave: blob.pathname, url: blob.url }
}

/** Lê um arquivo privado. Devolve `null` quando ele não existe mais no armazenamento. */
export async function lerPrivado(chave: string) {
  const arquivo = await get(chave, { access: 'private' })
  if (!arquivo || arquivo.statusCode !== 200) return null
  return { stream: arquivo.stream, contentType: arquivo.blob.contentType }
}

/** Remove um arquivo. Ausente não é erro: o objetivo (não existir mais) já está cumprido. */
export async function apagarPrivado(chave: string) {
  await del(chave)
}

// ─── Currículos ──────────────────────────────────────────────────────────────
// A chave vai em `cvPublicId` (nome herdado do Cloudinary). O prefixo `cvs/` é
// conferido antes de servir, para uma chave adulterada não abrir outro arquivo.

export function novaChaveCv() {
  return `cvs/${randomUUID()}.pdf`
}

export function chaveDeCvValida(chave: string) {
  return /^cvs\/[A-Za-z0-9._-]+$/.test(chave)
}

// ─── Imagens (foto de perfil, capas da Universidade) ─────────────────────────
// Servidas por /api/arquivos/imagem/<arquivo>. A chave é aleatória (UUID), então
// o endereço não é adivinhável, e a imagem nunca muda (trocar = nova chave).

export const PREFIXO_URL_IMAGEM = '/api/arquivos/imagem/'

export function novaChaveImagem(extensao: string) {
  return `imagens/${randomUUID()}.${extensao}`
}

export function urlDaImagem(chave: string) {
  return PREFIXO_URL_IMAGEM + chave.replace(/^imagens\//, '')
}

/** Aceita imagem enviada pelo portal (endereço interno) ou um link https externo. */
export const urlDeImagemSchema = z
  .string()
  .max(500)
  .refine(
    (valor) =>
      /^https:\/\/\S+$/.test(valor) ||
      new RegExp(`^${PREFIXO_URL_IMAGEM}[A-Za-z0-9-]+\\.(jpg|png|webp|gif)$`).test(valor),
    'Imagem inválida',
  )
