'use client'

import { PaginaCadastro } from '../../_components/PaginaCadastro'
import { SECOES_CARGO, VALORES_CARGO } from '../_campos'

export default function NovoCargoPage() {
  return (
    <PaginaCadastro
      modo="criar"
      titulo="Novo descritivo de cargo"
      subtitulo="É contra este padrão que o verificador confere as vagas abertas."
      voltarPara="/gente/cargos"
      voltarLabel="Descritivos de Cargo"
      endpoint="/api/gente/cargos"
      secoes={SECOES_CARGO}
      valoresVazios={VALORES_CARGO}
      rotuloCriar="Criar descritivo"
    />
  )
}
