'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, X, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  aspectRatio?: '16/9' | '1/1' | '4/3'
  label?: string
}

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ImageUpload({ value, onChange, onRemove, aspectRatio = '16/9', label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use JPG, PNG ou WEBP.', variant: 'destructive' })
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: `Máximo ${MAX_SIZE_MB}MB.`, variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('aspectRatio', aspectRatio)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)

      onChange(data.url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tente novamente'
      toast({ title: 'Erro ao fazer upload', description: msg, variant: 'destructive' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      {label && <label className="text-xs text-slate-400 font-medium block mb-1.5">{label}</label>}
      <div className="relative w-full h-[180px]">
        {value ? (
          <div className="relative w-full h-full rounded-xl overflow-hidden">
            <Image
              src={value}
              alt="Preview"
              fill
              unoptimized
              className="object-cover"
            />
            {onRemove && (
              <button type="button" onClick={onRemove}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors shadow-lg">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()} onDrop={handleDrop}
            className="w-full h-full rounded-xl border-2 border-dashed border-white/15 hover:border-brand-500/40 bg-white/3 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
            <Camera className="w-7 h-7 text-slate-500" />
            <span className="text-sm text-slate-400 font-medium">Clique para selecionar</span>
            <span className="text-xs text-slate-600">JPG, PNG ou WEBP · máx 5MB</span>
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            <span className="text-xs text-slate-300">Enviando...</span>
          </div>
        )}

        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleChange} className="hidden" />
      </div>
    </div>
  )
}
