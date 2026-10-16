import { redirect } from 'next/navigation'

/**
 * O pipeline virou a visão padrão de `/gente/sucessao`.
 * Esta rota fica como atalho para quem já tinha o link salvo.
 */
export default function PipelineRedirect() {
  redirect('/gente/sucessao')
}
