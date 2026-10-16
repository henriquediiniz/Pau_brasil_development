'use client'

import { useEffect } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import { EmailsCurriculo } from '@/app/_components/EmailsCurriculo'

/**
 * "Consulte a LGPD" — o que o candidato está aceitando, em linguagem simples.
 *
 * Pedido do PO (2026-10-07). O texto descreve só o que o sistema faz de fato:
 * os campos que o formulário pede, quem acessa (a tela do Banco de Talentos é
 * restrita ao RH) e a exclusão automática do currículo 10 dias depois de a
 * candidatura ser encerrada (`/api/cron/limpar-cvs`). Se algo disso mudar, o
 * texto precisa mudar junto.
 *
 * Não substitui uma política de privacidade revisada pelo jurídico.
 */
export function AvisoLgpd({ aoFechar }: { aoFechar: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', fn)
    // Trava a rolagem da página atrás do modal, que no celular rolaria junto.
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', fn)
      document.body.style.overflow = anterior
    }
  }, [aoFechar])

  const titulo = 'text-sm font-semibold text-white mb-1.5'
  const texto = 'text-xs text-slate-300 leading-relaxed'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Sem backdrop-blur de proposito: borrao em tela cheia pesa no iPhone. */}
      <div className="absolute inset-0 bg-black/75" onClick={aoFechar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgpd-titulo"
        className="relative w-full sm:max-w-lg max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#111118] border border-white/10"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 id="lgpd-titulo" className="text-base font-display font-bold text-white">
              Seus dados e a LGPD
            </h2>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="p-1.5 -mr-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          <section>
            <h3 className={titulo}>O que é a LGPD</h3>
            <p className={texto}>
              A Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) define como as empresas
              podem coletar, usar e guardar dados de pessoas, e garante a você, dono dos dados,
              direitos sobre eles.
            </p>
          </section>

          <section>
            <h3 className={titulo}>Quais dados pedimos</h3>
            <p className={texto}>
              Seu currículo em PDF, nome, e-mail, telefone, cidade e estado, data de nascimento,
              gênero, escolaridade, os cargos que você escolher e a mensagem, se você escrever uma.
            </p>
          </section>

          <section>
            <h3 className={titulo}>Para que usamos</h3>
            <p className={texto}>
              Apenas para recrutamento e seleção no Grupo Pau Brasil: analisar o seu perfil, falar
              com você sobre vagas e manter o seu currículo no nosso Banco de Talentos.
            </p>
          </section>

          <section>
            <h3 className={titulo}>Quem vê</h3>
            <p className={texto}>
              A equipe de Gente &amp; Gestão e as pessoas envolvidas no processo seletivo.
            </p>
          </section>

          <section>
            <h3 className={titulo}>Por quanto tempo guardamos</h3>
            <p className={texto}>
              Enquanto você estiver no Banco de Talentos. Se a sua candidatura for encerrada, o
              currículo é apagado automaticamente 10 dias depois.
            </p>
          </section>

          <section>
            <h3 className={titulo}>Seus direitos</h3>
            <p className={texto}>
              Você pode, a qualquer momento, saber quais dados seus temos, corrigi-los, pedir que
              sejam apagados ou retirar este consentimento (art. 18 da LGPD). Para isso, escreva
              para:
            </p>
            <div className="mt-2 text-xs">
              <EmailsCurriculo />
            </div>
          </section>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ao marcar &quot;Concordo&quot;, você autoriza o uso dos seus dados para essas finalidades
            (art. 7º, I, da LGPD).
          </p>
        </div>

        <div className="px-5 py-3 border-t border-white/8">
          <button
            onClick={aoFechar}
            className="w-full px-4 py-2.5 rounded-xl bg-white text-[#0d0d14] text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
