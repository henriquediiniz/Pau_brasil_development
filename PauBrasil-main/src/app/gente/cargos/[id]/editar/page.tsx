'use client';
import { use } from "react";

import { PaginaCadastro } from '../../../_components/PaginaCadastro'
import { SECOES_CARGO, VALORES_CARGO } from '../../_campos'

export default function EditarCargoPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
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
