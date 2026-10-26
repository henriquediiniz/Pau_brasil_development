'use client';
import { use } from "react";

import { PaginaCadastro } from '../../../_components/PaginaCadastro'
import { SECOES_SUCESSAO, VALORES_SUCESSAO } from '../../_campos'

export default function EditarSucessaoPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
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
