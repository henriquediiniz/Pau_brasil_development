/** Loja suspensa a pedido do grupo enquanto os requisitos são revisados.
 * Dados e serviços legados permanecem preservados; nenhuma migração destrutiva.
 */
export const REWARDS_STORE_ENABLED = false

/** Destinos retirados do portal; links antigos voltam ao início. */
const RETIRED_PORTAL_PATHS = [
  '/app/hoje', '/app/pontos', '/app/conquistas', '/app/ranking',
  '/app/loja', '/app/resgates', '/app/cockpit',
  '/coord/atividades', '/coord/aprovacoes',
  '/gestor/dashboard', '/gestor/aprovacoes', '/gestor/relatorio', '/gestor/metas',
  '/admin/aprovacoes', '/admin/metas', '/admin/loja', '/admin/resgates',
]

export function isRetiredPortalPath(path: string) {
  return RETIRED_PORTAL_PATHS.some(route => path === route || path.startsWith(`${route}/`))
}
