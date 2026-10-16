'use client'

import { PaginaCadastro } from '../../../_components/PaginaCadastro'
import { SECOES_SUCESSAO, VALORES_SUCESSAO } from '../../_campos'

export default function EditarSucessaoPage({ params }: { params: { id: string } }) {
  return (
    <PaginaCadastro
      modo="editar"
      id={params.id}
      titulo="Editar mapeamento"
      voltarPara="/gente/sucessao"
      voltarLabel="Pipeline de Sucessão"
      endpoint="/api/gente/sucessao"
      secoes={SECOES_SUCESSAO}
      valoresVazios={VALORES_SUCESSAO}
      camposData={['inicioMapeamento']}
    />
  )
}
