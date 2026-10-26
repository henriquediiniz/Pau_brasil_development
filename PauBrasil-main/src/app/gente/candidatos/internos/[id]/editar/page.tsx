'use client';
import { use } from "react";

import { PaginaCadastro } from '../../../../_components/PaginaCadastro'
import { SECOES_INTERNO, VALORES_INTERNO } from '../../../../sucessao/_campos'

export default function EditarInternoPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
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
