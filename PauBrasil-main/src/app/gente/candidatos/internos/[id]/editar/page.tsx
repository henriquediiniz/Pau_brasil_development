'use client'

import { PaginaCadastro } from '../../../../_components/PaginaCadastro'
import { SECOES_INTERNO, VALORES_INTERNO } from '../../../../sucessao/_campos'

export default function EditarInternoPage({ params }: { params: { id: string } }) {
  return (
    <PaginaCadastro
      modo="editar"
      id={params.id}
      titulo="Editar candidato interno"
      voltarPara="/gente/candidatos/internos"
      voltarLabel="Candidatos Internos"
      endpoint="/api/gente/internos"
      secoes={SECOES_INTERNO}
      valoresVazios={VALORES_INTERNO}
    />
  )
}
