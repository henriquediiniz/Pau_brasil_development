'use client'

import { PaginaCadastro } from '../../_components/PaginaCadastro'
import { SECOES_PCD, VALORES_PCD } from '../_campos'

export default function NovoPcdPage() {
  return (
    <PaginaCadastro
      modo="criar"
      titulo="Novo colaborador PCD"
      subtitulo="O laudo é anexado depois, na lista — é dado de saúde e trafega separado do cadastro."
      voltarPara="/gente/pcd"
      voltarLabel="Gestão PCD"
      endpoint="/api/gente/pcd"
      secoes={SECOES_PCD}
      valoresVazios={VALORES_PCD}
      camposData={['admissao']}
    />
  )
}
