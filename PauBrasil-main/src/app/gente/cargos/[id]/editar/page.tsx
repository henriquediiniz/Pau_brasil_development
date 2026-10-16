'use client'

import { PaginaCadastro } from '../../../_components/PaginaCadastro'
import { SECOES_CARGO, VALORES_CARGO } from '../../_campos'

export default function EditarCargoPage({ params }: { params: { id: string } }) {
  return (
    <PaginaCadastro
      modo="editar"
      id={params.id}
      titulo="Editar descritivo"
      voltarPara="/gente/cargos"
      voltarLabel="Descritivos de Cargo"
      endpoint="/api/gente/cargos"
      secoes={SECOES_CARGO}
      valoresVazios={VALORES_CARGO}
    />
  )
}
