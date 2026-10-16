'use client'

import { PaginaCadastro } from '../../_components/PaginaCadastro'
import { SECOES_SUCESSAO, VALORES_SUCESSAO } from '../_campos'

export default function NovaSucessaoPage() {
  return (
    <PaginaCadastro
      modo="criar"
      titulo="Novo mapeamento de sucessão"
      subtitulo="Um cargo sem sucessor pronto agora nem em 1 ano entra como cargo em risco."
      voltarPara="/gente/sucessao"
      voltarLabel="Pipeline de Sucessão"
      endpoint="/api/gente/sucessao"
      secoes={SECOES_SUCESSAO}
      valoresVazios={VALORES_SUCESSAO}
      camposData={['inicioMapeamento']}
      rotuloCriar="Criar mapeamento"
    />
  )
}
