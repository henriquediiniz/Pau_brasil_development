'use client'

import { PaginaCadastro } from '../../../_components/PaginaCadastro'
import { SECOES_PCD, VALORES_PCD } from '../../_campos'

export default function EditarPcdPage({ params }: { params: { id: string } }) {
  return (
    <PaginaCadastro
      modo="editar"
      id={params.id}
      titulo="Editar colaborador PCD"
      voltarPara="/gente/pcd"
      voltarLabel="Gestão PCD"
      endpoint="/api/gente/pcd"
      secoes={SECOES_PCD}
      valoresVazios={VALORES_PCD}
      camposData={['admissao']}
    />
  )
}
