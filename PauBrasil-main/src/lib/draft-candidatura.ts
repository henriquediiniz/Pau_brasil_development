/**
 * src/lib/draft-candidatura.ts
 *
 * Gerencia rascunhos do formulário de candidatura no localStorage.
 *
 * Isolamento: chave inclui o e-mail normalizado — evita vazamento entre
 * usuários no mesmo dispositivo compartilhado.
 *
 * TTL: rascunhos expiram automaticamente após 7 dias sem acesso.
 * Fail-safe: todas as operações capturam erros silenciosamente
 * (localStorage pode estar bloqueado em modo privado ou storage cheio).
 */

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

export interface CandidaturaDraftData {
  nome:              string
  email:             string
  telefone:          string
  cidade:            string
  estado:            string
  cargosInteresse:   string[]
  mensagem:          string
  consentimentoLgpd: boolean
  // Opcionais: rascunho salvo antes destes campos existirem continua valido.
  genero?:           string
  dataNascimento?:   string
  escolaridade?:     string
}

interface DraftPayload {
  data:    CandidaturaDraftData
  savedAt: number
}

function draftKey(email: string): string {
  const normalized = (email ?? '').trim().toLowerCase()
  // Usa 'anon' quando e-mail ainda não foi preenchido (step 1)
  return `pb_candidatura_draft_${normalized || 'anon'}`
}

/**
 * Salva o rascunho atual. Seguro chamar a cada keystroke.
 */
export function saveDraft(email: string, data: CandidaturaDraftData): void {
  try {
    const payload: DraftPayload = { data, savedAt: Date.now() }
    localStorage.setItem(draftKey(email), JSON.stringify(payload))
  } catch {
    // Falha silenciosa — localStorage cheio ou bloqueado
  }
}

/**
 * Carrega o rascunho para o e-mail informado.
 * Retorna null se não existir, estiver corrompido ou expirado.
 */
export function loadDraft(email: string): CandidaturaDraftData | null {
  try {
    const raw = localStorage.getItem(draftKey(email))
    if (!raw) return null

    const payload: DraftPayload = JSON.parse(raw)

    if (Date.now() - payload.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(draftKey(email))
      return null
    }

    return payload.data
  } catch {
    return null
  }
}

/**
 * Remove o rascunho após candidatura enviada com sucesso.
 * Também limpa o rascunho 'anon' caso exista.
 */
export function clearDraft(email: string): void {
  try {
    localStorage.removeItem(draftKey(email))
    localStorage.removeItem(draftKey('')) // limpa anon se existir
  } catch {}
}

/**
 * Migra um rascunho 'anon' (salvo antes do e-mail ser preenchido)
 * para a chave com e-mail, evitando perda de dados ao identificar o usuário.
 */
export function migrateDraft(email: string): void {
  try {
    const anonKey  = draftKey('')
    const emailKey = draftKey(email)
    const raw = localStorage.getItem(anonKey)
    if (raw && !localStorage.getItem(emailKey)) {
      localStorage.setItem(emailKey, raw)
      localStorage.removeItem(anonKey)
    }
  } catch {}
}
