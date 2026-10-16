'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle2, Loader2, AlertCircle, ArrowLeft, User, RefreshCw } from 'lucide-react'

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

type Stage = 'idle' | 'loading-models' | 'detecting' | 'preview' | 'uploading' | 'done' | 'error'

export default function ConfigurarFacePage() {
  const router = useRouter()

  // video e canvas ficam sempre no DOM — evita race condition no iOS Safari
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const faRef = useRef<any>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState('')
  const [savedUrl, setSavedUrl] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)

  function stopCamera() {
    cancelAnimationFrame(rafRef.current)
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  useEffect(() => () => stopCamera(), [])

  async function start() {
    setStage('loading-models')
    setError('')
    setPreviewDataUrl(null)
    try {
      // Pede permissão de câmera primeiro — feedback imediato antes de carregar modelos
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream

      const video = videoRef.current!
      video.srcObject = stream
      video.play().catch(() => {})

      // Carrega modelos em paralelo enquanto a câmera já está ativa
      const fa = await import('@vladmandic/face-api')
      await Promise.all([
        fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      faRef.current = fa

      if (!video.paused) {
        setStage('detecting')
        detectLoop(fa, video)
      }
    } catch (e: any) {
      stopCamera()
      const name: string = e?.name ?? ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || (e?.message ?? '').includes('Permission denied')) {
        setError('Permissão de câmera negada. No Chrome Android: toque no ícone de câmera/cadeado na barra de endereço → selecione "Permitir" → tente novamente. Em Xiaomi/POCO, verifique também Configurações › Aplicativos › Chrome › Permissões › Câmera.')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo.')
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('A câmera está em uso por outro aplicativo. Feche outros apps e tente novamente.')
      } else {
        setError(e?.message ?? 'Erro ao iniciar câmera')
      }
      setStage('error')
    }
  }

  function detectLoop(fa: any, video: HTMLVideoElement) {
    // Throttle: inferência máximo a cada 350ms para evitar Long Tasks
    let inferring = false
    let nextTs = 0

    const loop = (timestamp: number) => {
      if (!streamRef.current) return
      rafRef.current = requestAnimationFrame(loop)
      if (inferring || timestamp < nextTs) return
      inferring = true
      nextTs = timestamp + 350

      // threshold 0.85: rigoroso mas sem falsos negativos excessivos
      fa.detectSingleFace(video, new fa.SsdMobilenetv1Options({ minConfidence: 0.85 }))
        .withFaceLandmarks()
        .then((detection: any) => {
          if (detection && streamRef.current) {
            cancelAnimationFrame(rafRef.current)
            startCountdown()
          }
        })
        .catch(() => {})
        .finally(() => { inferring = false })
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  function startCountdown() {
    let remaining = 3
    setCountdown(remaining)
    countdownRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearInterval(countdownRef.current!)
        countdownRef.current = null
        setCountdown(null)
        capturePreview()
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }

  function capturePreview() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

    stopCamera()
    setPreviewDataUrl(dataUrl)
    setStage('preview')
  }

  function retakePhoto() {
    setPreviewDataUrl(null)
    start()
  }

  async function confirmUpload() {
    if (!previewDataUrl) return
    setStage('uploading')
    try {
      const res = await fetch('/api/visitas/cadastrar-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: previewDataUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSavedUrl(data.faceReferenceUrl ?? previewDataUrl)
      setStage('done')
    } catch (e: any) {
      setError(e.message ?? 'Erro ao salvar foto')
      setStage('error')
    }
  }

  const showCamera = stage === 'detecting'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-brand-400" /> Configurar Reconhecimento Facial
          </h1>
          <p className="text-slate-500 text-sm">Sua foto de referência para check-ins</p>
        </div>
      </div>

      {/* Câmera: sempre no DOM, visível só quando detecting */}
      <div className={showCamera ? 'space-y-3' : 'hidden'}>
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          <div className={`absolute inset-0 border-2 rounded-2xl pointer-events-none transition-colors duration-300 ${countdown !== null ? 'border-emerald-400/80' : 'border-brand-500/40'}`} />
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <span className="text-8xl font-black text-white drop-shadow-[0_0_24px_rgba(0,0,0,0.9)]">
                {countdown}
              </span>
            </div>
          )}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              {countdown !== null ? 'Segure firme...' : 'Posicione seu rosto no centro'}
            </span>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <p className="text-slate-400 text-sm text-center">Captura automática quando o rosto for detectado</p>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold mb-1">Cadastrar foto de referência</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Você precisará desta foto para fazer check-in nas filiais. Posicione seu rosto centralizado e bem iluminado.
              </p>
            </div>
            <button onClick={start}
              className="px-6 py-3 rounded-xl gradient-brand text-white font-semibold shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all">
              Abrir câmera
            </button>
          </motion.div>
        )}

        {(stage === 'loading-models' || stage === 'uploading') && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin mx-auto" />
            <p className="text-white font-medium">
              {stage === 'loading-models' ? 'Carregando modelos de reconhecimento...' : 'Salvando foto de referência...'}
            </p>
            <p className="text-slate-500 text-sm">Aguarde alguns instantes</p>
          </motion.div>
        )}

        {stage === 'preview' && previewDataUrl && (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-5">
            <div className="text-center">
              <h2 className="text-white font-bold text-lg">Como ficou?</h2>
              <p className="text-slate-400 text-sm mt-1">Verifique se a foto está nítida e seu rosto está visível.</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewDataUrl} alt="Preview" className="w-full rounded-2xl object-cover max-h-64" />
            <div className="flex gap-3">
              <button onClick={retakePhoto}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">
                <RefreshCw className="w-4 h-4" /> Tirar nova foto
              </button>
              <button onClick={confirmUpload}
                className="flex-1 px-4 py-3 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-brand-500/20">
                Usar esta foto
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-8 text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.1, duration: 0.5 }}>
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            </motion.div>
            <div>
              <h2 className="text-white font-bold text-lg">Foto cadastrada!</h2>
              <p className="text-slate-400 text-sm mt-1">Seu reconhecimento facial está pronto para check-ins.</p>
            </div>
            {savedUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={savedUrl} alt="Foto de referência" className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-emerald-500/40" />
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => { stopCamera(); setStage('idle'); setSavedUrl(null); setPreviewDataUrl(null) }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">
                Refazer foto
              </button>
              <button onClick={() => router.push('/app/visitas/checkin')}
                className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20">
                Ir para Check-in
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-red-500/10 border border-red-500/30 p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h2 className="text-white font-bold">Algo deu errado</h2>
              <p className="text-slate-400 text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => { stopCamera(); setStage('idle') }}
              className="px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium">
              Tentar novamente
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
