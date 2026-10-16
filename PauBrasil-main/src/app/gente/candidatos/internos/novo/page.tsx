'use client'

import { PaginaCadastro } from '../../../_components/PaginaCadastro'
import { SECOES_INTERNO, VALORES_INTERNO } from '../../../sucessao/_campos'

export default function NovoInternoPage() {
  return (
    <PaginaCadastro
      modo="criar"
      titulo="Novo candidato interno"
      subtitulo="Quem da casa está mapeado para crescer, e para qual cargo."
      voltarPara="/gente/candidatos/internos"
      voltarLabel="Candidatos Internos"
      endpoint="/api/gente/internos"
      secoes={SECOES_INTERNO}
      valoresVazios={VALORES_INTERNO}
    />
  )
}
