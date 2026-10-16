'use client'

/**
 * Peças de formulário do módulo Gente.
 *
 * Estavam repetidas em cada formulário; ficam aqui para que rótulo, erro e
 * dica tenham sempre o mesmo comportamento — inclusive a regra de que a dica
 * some quando há erro, para não competirem pelo mesmo espaço.
 */

export function entrada(erro?: string) {
  return `w-full px-3 py-2 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
    erro ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/10 focus:border-brand-500/40'
  }`
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-3">
      <legend className="px-2 text-[11px] uppercase tracking-wide text-slate-500">{titulo}</legend>
      {children}
    </fieldset>
  )
}

export function Campo({
  label,
  erro,
  dica,
  obrigatorio,
  children,
}: {
  label: string
  erro?: string
  dica?: string
  obrigatorio?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-400 mb-1">
        {label}
        {obrigatorio && <span className="text-brand-400"> *</span>}
      </span>
      {children}
      {erro ? (
        <span className="block text-[11px] text-red-400 mt-1">{erro}</span>
      ) : dica ? (
        <span className="block text-[11px] text-slate-500 mt-1">{dica}</span>
      ) : null}
    </label>
  )
}

export function SemEscopo() {
  return (
    <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
      <p className="text-white font-medium">Nenhuma operação atribuída ao seu usuário</p>
      <p className="text-slate-400 text-sm mt-1">
        Peça a um administrador para vincular as suas operações antes de cadastrar.
      </p>
    </div>
  )
}
