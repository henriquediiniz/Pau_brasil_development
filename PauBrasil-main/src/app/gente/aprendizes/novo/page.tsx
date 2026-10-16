'use client'

import { PaginaCadastro } from '../../_components/PaginaCadastro'
import { SECOES_APRENDIZ, VALORES_APRENDIZ, validarAprendiz } from '../../pcd/_campos'

export default function NovoAprendizPage() {
  return (
    <PaginaCadastro
      modo="criar"
      titulo="Novo aprendiz"
      subtitulo="Preencha o término do contrato — é ele que alimenta o alerta de vencimento."
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
