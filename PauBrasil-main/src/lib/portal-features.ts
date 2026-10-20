/** Destinos retirados do portal; links antigos voltam ao início. */
const RETIRED_PORTAL_PATHS = [
  '/app/hoje', '/app/pontos', '/app/conquistas', '/app/ranking',
  '/app/loja', '/app/resgates', '/app/cockpit',
  '/coord/atividades', '/coord/aprovacoes',
  '/gestor/dashboard', '/gestor/aprovacoes', '/gestor/relatorio', '/gestor/metas',
  '/admin/aprovacoes', '/admin/metas', '/admin/loja', '/admin/resgates',
  // Visitas de líderes (check-in, face, obrigações) retirado em 19/10/2026.
  '/app/visitas', '/admin/visitas',
]

export function isRetiredPortalPath(path: string) {
  return RETIRED_PORTAL_PATHS.some(route => path === route || path.startsWith(`${route}/`))
}
