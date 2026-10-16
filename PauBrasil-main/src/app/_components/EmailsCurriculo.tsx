/**
 * Para onde mandar o currículo por e-mail, por unidade.
 *
 * Até 2026-10-07 o site mostrava só o e-mail de Patos, e currículo para vaga
 * de Sousa chegava na caixa errada (PO). O link aparece antes de a pessoa dizer
 * a cidade, então não dá para escolher por ela: mostram-se os dois, cada um
 * com a sua unidade.
 *
 * O assunto já vem preenchido com a unidade, para o RH triar a caixa.
 */
export const EMAILS_CURRICULO = [
  { unidade: 'Patos', email: 'agg.patos@grupopaubrasil.com.br' },
  { unidade: 'Sousa', email: 'cgg.sousa@grupopaubrasil.com.br' },
] as const

export function EmailsCurriculo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${className}`}>
      {EMAILS_CURRICULO.map(({ unidade, email }) => (
        <span key={email} className="whitespace-nowrap">
          <span className="text-slate-500">Vagas em {unidade}:</span>{' '}
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`Currículo - ${unidade}`)}`}
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            {email}
          </a>
        </span>
      ))}
    </span>
  )
}
