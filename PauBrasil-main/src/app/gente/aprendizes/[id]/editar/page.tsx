'use client';
import { use } from "react";

import { PaginaCadastro } from '../../../_components/PaginaCadastro'
import { SECOES_APRENDIZ, VALORES_APRENDIZ, validarAprendiz } from '../../../pcd/_campos'

export default function EditarAprendizPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  return (
    <PaginaCadastro
      modo="editar"
      id={params.id}
      titulo="Editar aprendiz"
      voltarPara="/gente/aprendizes"
      voltarLabel="Jovens Aprendizes"
      endpoint="/api/gente/aprendizes"
      secoes={SECOES_APRENDIZ}
      valoresVazios={VALORES_APRENDIZ}
      camposData={['admissao', 'dataNascimento', 'inicioContrato', 'terminoContrato']}
      validar={validarAprendiz}
    />
  )
}
