'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CheckCircle2, Loader2, AlertCircle, ArrowLeft, XCircle, User, Camera, Wifi, WifiOff, Clock,
} from 'lucide-react'
import { enqueueCheckin } from '@/lib/checkin-queue'

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

type Phase = 'gps-loading' | 'gps-invalid' | 'face-loading' | 'face-detecting' | 'uploading' | 'done' | 'queued' | 'error' | 'offline' | 'rate-limited'

// Anel SVG de confiança facial — vermelho → amarelo → verde
function ConfidenceRing({ score }: { score: number }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = circ * score
  const color = score < 0.4 ? '#f87171' : score < 0.75 ? '#fbbf24' : '#34d399'
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 0.2s ease, stroke 0.2s ease' }}
      />
    </svg>
  )
}

export default function CheckinPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const operacao = params?.operacao as string

  // video e canvas ficam sempre no DOM — evita race condition no iOS Safari
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phase, setPhase] = useState<Phase>('gps-loading')
  const [error, setError] = useState('')
  const [gpsDistance, setGpsDistance] = useState<number | null>(null)
  const [operationName, setOperationName] = useState('')
  const [gpsRadius, setGpsRadius] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [faceScore, setFaceScore] = useState<number | null>(null)
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  function stopCamera() {
    cancelAnimationFrame(rafRef.current)
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function startCountdown() {
    if (countdownRef.current) return
    let remaining = 3
    setCountdown(remaining)
    countdownRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearInterval(countdownRef.current!)
        countdownRef.current = null
        setCountdown(null)
        capture()
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }

  useEffect(() => () => stopCamera(), [])

  // Detecta mudança de conectividade
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    setIsOnline(navigator.onLine)
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [])

  // Phase 1: GPS
  useEffect(() => {
    if (!operacao) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        coordsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        startFacePhase()
      },
      () => {
        setError('Não foi possível obter sua localização. Verifique as permissões do navegador.')
        setPhase('error')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operacao])

  const startFacePhase = useCallback(async () => {
    if (!navigator.onLine) {
      setPhase('offline')
      return
    }

    setPhase('face-loading')
    try {
      const fa = await import('@vladmandic/face-api')
      await fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
      await fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      await fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL)

      const faceRefUrl = session?.user?.faceReferenceUrl
      if (!faceRefUrl) {
        setError('Foto de referência não configurada. Acesse "Configurar Reconhecimento Facial" primeiro.')
        setPhase('error')
        return
      }

      const refImg = await loadImage(faceRefUrl)
      const refDetection = await fa
        .detectSingleFace(refImg, new fa.SsdMobilenetv1Options({ minConfidence: 0.7 }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!refDetection) {
        setError('Não foi possível processar sua foto de referência. Reconfigure o reconhecimento facial.')
        setPhase('error')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream

      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      setPhase('face-detecting')
      detectLoop(fa, video, refDetection.descriptor)
    } catch (e: any) {
      setError(e.message ?? 'Erro ao iniciar câmera')
      setPhase('error')
    }
  }, [session])

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  function detectLoop(fa: any, video: HTMLVideoElement, refDescriptor: Float32Array) {
    let inferring = false
    let nextTs = 0

    const loop = (timestamp: number) => {
      if (!streamRef.current) return
      rafRef.current = requestAnimationFrame(loop)
      if (inferring || timestamp < nextTs) return
      inferring = true
      nextTs = timestamp + 350

      fa.detectSingleFace(video, new fa.SsdMobilenetv1Options({ minConfidence: 0.7 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
        .then((detection: any) => {
          if (detection && streamRef.current) {
            const dist = fa.euclideanDistance(detection.descriptor, refDescriptor)
            // score 0–1: quanto mais próximo de 1, mais confiante
            const score = Math.max(0, Math.min(1, 1 - dist / 0.6))
            setFaceScore(score)
            if (dist < 0.6) {
              cancelAnimationFrame(rafRef.current)
              startCountdown()
            }
          } else {
            setFaceScore(null)
          }
        })
        .catch(() => { setFaceScore(null) })
        .finally(() => { inferring = false })
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  async function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.85)

    stopCamera()
    setPhase('uploading')

    const coords = coordsRef.current
    if (!coords) {
      setError('Localização perdida durante o processo. Tente novamente.')
      setPhase('error')
      return
    }

    const checkinPayload = {
      operationSlug: operacao,
      latitude: coords.lat,
      longitude: coords.lon,
      photoBase64,
      faceValid: true,
    }

    // Offline: enfileira no IndexedDB e registra background sync
    if (!navigator.onLine) {
      try {
        await enqueueCheckin(checkinPayload)
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready
          await (reg as any).sync?.register('checkin-queue').catch(() => {})
        }
        navigator.vibrate?.([100, 50, 100])
        setPhase('queued')
      } catch {
        setError('Sem conexão e falha ao salvar offline.')
        setPhase('error')
      }
      return
    }

    try {
      const res = await fetch('/api/visitas/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkinPayload),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setRateLimitSeconds(data.retryAfter ?? null)
          setPhase('rate-limited')
        } else if (res.status === 422 && data.distanceMeters != null) {
          setGpsDistance(data.distanceMeters)
          setOperationName(data.operationName ?? operacao)
          setGpsRadius(data.radiusMeters ?? null)
          setPhase('gps-invalid')
        } else {
          throw new Error(data.error)
        }
        return
      }
      navigator.vibrate?.([100, 50, 200])
      setPhase('done')
    } catch (e: any) {
      setError(e.message ?? 'Erro ao registrar visita')
      setPhase('error')
    }
  }

  const showCamera = phase === 'face-detecting'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-400" /> Check-in na Filial
          </h1>
          <p className="text-slate-500 text-sm capitalize">{operacao?.replace(/-/g, ' ')}</p>
        </div>
      </div>

      {/* Câmera: sempre no DOM, visível só quando face-detecting */}
      <div className={showCamera ? 'space-y-3' : 'hidden'}>
        <div className={`relative rounded-2xl overflow-hidden bg-black aspect-[4/3] transition-all duration-300 ${countdown !== null ? 'ring-4 ring-emerald-500' : ''}`}>
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

          {/* Anel de confiança facial */}
          {countdown === null && faceScore !== null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-32 h-32">
                <ConfidenceRing score={faceScore} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{Math.round(faceScore * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Overlay de countdown */}
          {countdown !== null ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <span className="text-8xl font-bold text-white drop-shadow-lg leading-none">{countdown}</span>
              <span className="text-white text-sm mt-3 flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Segure firme...
              </span>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 border-2 border-brand-500/40 rounded-2xl pointer-events-none" />
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <span className="bg-brand-500/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Reconhecendo rosto...
                </span>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Olhe diretamente para a câmera
                </span>
              </div>
            </>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <p className="text-slate-400 text-sm text-center">
          {countdown !== null ? 'Capturando em breve...' : 'Check-in automático quando seu rosto for reconhecido'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'gps-loading' && (
          <motion.div key="gps-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin mx-auto" />
            <p className="text-white font-medium">Verificando localização...</p>
            <p className="text-slate-500 text-sm">Aguarde enquanto obtemos seu GPS</p>
          </motion.div>
        )}

        {phase === 'queued' && (
          <motion.div key="queued"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-8 text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}>
              <WifiOff className="w-12 h-12 text-amber-400 mx-auto" />
            </motion.div>
            <div>
              <h2 className="text-white font-bold text-lg">Check-in salvo offline</h2>
              <p className="text-slate-400 text-sm mt-1">
                Seu check-in foi registrado localmente e será enviado automaticamente quando a conexão retornar.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-amber-400 text-xs">
              <Clock className="w-3.5 h-3.5" /> Pendente — aguardando conexão
            </div>
            <button onClick={() => router.replace('/app/visitas/checkin')}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">
              Voltar à lista
            </button>
          </motion.div>
        )}

        {phase === 'offline' && (
          <motion.div key="offline" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-slate-500/10 border border-slate-500/30 p-8 text-center space-y-4">
            <Wifi className="w-12 h-12 text-slate-400 mx-auto" />
            <div>
              <h2 className="text-white font-bold text-lg">Sem conexão</h2>
              <p className="text-slate-400 text-sm mt-1">
                Verifique sua rede e o check-in será retomado automaticamente.
              </p>
            </div>
            {isOnline && (
              <button onClick={() => startFacePhase()}
                className="px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium">
                Tentar novamente
              </button>
            )}
          </motion.div>
        )}

        {phase === 'rate-limited' && (
          <motion.div key="rate-limited" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-brand-500/10 border border-brand-500/30 p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-brand-400 mx-auto" />
            <div>
              <h2 className="text-white font-bold text-lg">Check-in recente</h2>
              <p className="text-slate-400 text-sm mt-1">
                Você já realizou o check-in nesta filial recentemente.
                {rateLimitSeconds != null && ` Próximo disponível em ${Math.ceil(rateLimitSeconds / 60)} min.`}
              </p>
            </div>
            <button onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm">
              Voltar
            </button>
          </motion.div>
        )}

        {phase === 'gps-invalid' && (
          <motion.div key="gps-invalid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-orange-500/10 border border-orange-500/30 p-8 text-center space-y-4">
            <XCircle className="w-12 h-12 text-orange-400 mx-auto" />
            <div>
              <h2 className="text-white font-bold text-lg">Fora do raio</h2>
              <p className="text-slate-400 text-sm mt-1">
                Você está a <span className="text-orange-400 font-semibold">{gpsDistance}m</span> da filial {operationName || operacao?.replace(/-/g, ' ')}.
              </p>
              <p className="text-slate-500 text-xs mt-1">Raio permitido: {gpsRadius != null ? `${gpsRadius}m` : '—'}</p>
            </div>
            <button onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">
              Voltar
            </button>
          </motion.div>
        )}

        {(phase === 'face-loading' || phase === 'uploading') && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin mx-auto" />
            <p className="text-white font-medium">
              {phase === 'face-loading' ? 'Preparando reconhecimento facial...' : 'Registrando visita...'}
            </p>
            <p className="text-slate-500 text-sm">Aguarde alguns instantes</p>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-8 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.1, duration: 0.5 }}>
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            </motion.div>
            <div>
              <h2 className="text-white font-bold text-xl">Check-in realizado!</h2>
              <p className="text-slate-400 text-sm mt-1 capitalize">
                Visita registrada em <span className="text-white">{operacao?.replace(/-/g, ' ')}</span>
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => router.push('/app/visitas/lider/' + session?.user?.id)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">
                Ver histórico
              </button>
              <button onClick={() => router.push('/app/inicio')}
                className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20">
                Ir para início
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-red-500/10 border border-red-500/30 p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h2 className="text-white font-bold">Algo deu errado</h2>
              <p className="text-slate-400 text-sm mt-1">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.back()}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm">
                Voltar
              </button>
              {error.includes('referência') && (
                <button onClick={() => router.push('/app/visitas/configurar-face')}
                  className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium">
                  Configurar foto
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
