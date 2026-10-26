'use client';
import { use } from "react";

import { PaginaCadastro } from '../../../_components/PaginaCadastro'
import { SECOES_PCD, VALORES_PCD } from '../../_campos'

export default function EditarPcdPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
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
