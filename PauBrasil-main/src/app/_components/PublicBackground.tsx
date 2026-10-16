'use client'

import { motion } from 'framer-motion'

export function PublicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">

      {/*
        ── Aurora orbs ─────────────────────────────────────────────────

        SEM `filter: blur()`, de proposito. Cada orbe tinha blur de 80-90px
        sobre um circulo de ate 900px. O borrao obriga o navegador a manter uma
        textura fora da tela maior que o proprio elemento; na tela de 3x do
        iPhone sao dezenas de MB por orbe, e os quatro somados derrubavam o
        Safari: "Um problema ocorreu repetidamente em .../carreiras/candidatar"
        (PO, 2026-09-30). Candidato nao conseguia se inscrever pelo celular.

        O borrao era redundante: o radial-gradient ja vai da cor ao
        transparente, e a borda sai suave sem ele. Medido no WebKit simulando
        iPhone 13: 0,7 -> 3,7 quadros/s e pior travada de 2,1 s -> 0,35 s. A
        animacao ficou — o custo nunca foi ela (orbes parados com blur
        continuavam a 0,8 quadro/s).
      */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 900, height: 900, top: -350, left: -300,
          background: 'radial-gradient(circle, #00c95122 0%, #00c9510a 40%, transparent 70%)',
        }}
        animate={{ x: [0, 55, 0], y: [0, 45, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 700, height: 700, top: -200, right: -200,
          background: 'radial-gradient(circle, #6366f125 0%, #6366f10d 40%, transparent 70%)',
        }}
        animate={{ x: [0, -60, 0], y: [0, 70, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 650, height: 650, bottom: -80, right: -120,
          background: 'radial-gradient(circle, #10b9811c 0%, #10b9810a 40%, transparent 70%)',
        }}
        animate={{ x: [0, -45, 0], y: [0, -55, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 550, height: 550, bottom: 0, left: -80,
          background: 'radial-gradient(circle, #00c95118 0%, #00c95108 40%, transparent 70%)',
        }}
        animate={{ x: [0, 70, 0], y: [0, -50, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
      />

      {/* ── Diagonal grid ─────────────────────────────────────────────── */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pb-grid" x="0" y="0" width="72" height="72"
            patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="72" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="0" y1="0" x2="72" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pb-grid)" />
      </svg>

      {/* ── Letterform "P" — left side ────────────────────────────────── */}
      <svg
        className="absolute top-[12%] -left-8"
        width="340" height="620"
        viewBox="0 0 340 620"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0" y="560"
          fontFamily="'DM Sans', 'Inter', Arial Black, sans-serif"
          fontWeight="900"
          fontSize="620"
          fill="none"
          stroke="rgba(255,255,255,0.055)"
          strokeWidth="1.5"
        >P</text>
        <text
          x="12" y="560"
          fontFamily="'DM Sans', 'Inter', Arial Black, sans-serif"
          fontWeight="900"
          fontSize="620"
          fill="none"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth="0.8"
        >P</text>
      </svg>

      {/* ── Letterform "B" — right side ───────────────────────────────── */}
      <svg
        className="absolute top-[30%] -right-16"
        width="380" height="620"
        viewBox="0 0 380 620"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="-40" y="560"
          fontFamily="'DM Sans', 'Inter', Arial Black, sans-serif"
          fontWeight="900"
          fontSize="620"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1.5"
        >B</text>
        <text
          x="-28" y="560"
          fontFamily="'DM Sans', 'Inter', Arial Black, sans-serif"
          fontWeight="900"
          fontSize="620"
          fill="none"
          stroke="rgba(255,255,255,0.018)"
          strokeWidth="0.8"
        >B</text>
      </svg>

    </div>
  )
}
