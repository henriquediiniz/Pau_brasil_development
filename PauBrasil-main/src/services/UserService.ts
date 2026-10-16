import { Level, LEVEL_THRESHOLDS } from '@/types'
import * as auth from '@/lib/auth-helpers'

export class UserService {
  /**
   * Calcula o nível do usuário baseado nos pontos acumulados.
   */
  static getLevelByPoints(points: number): Level {
    if (points >= 2000) return 'Diamante'
    if (points >= 1000) return 'Ouro'
    if (points >= 400) return 'Prata'
    return 'Bronze'
  }

  /**
   * Calcula o progresso (0-100) para o próximo nível.
   */
  static calculateLevelProgress(points: number): number {
    const currentLevel = this.getLevelByPoints(points)
    const nextLevel: Level | null = 
      currentLevel === 'Bronze' ? 'Prata' : 
      currentLevel === 'Prata' ? 'Ouro' : 
      currentLevel === 'Ouro' ? 'Diamante' : null

    if (!nextLevel) return 100 // Já é Diamante

    const currentThreshold = LEVEL_THRESHOLDS[currentLevel]
    const nextThreshold = LEVEL_THRESHOLDS[nextLevel]
    
    return Math.max(0, Math.min(100, 
      Math.round(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    ))
  }

  /**
   * Helpers de Permissão (RBAC)
   * Encapsulam a lógica de auth-helpers para uma interface de serviço.
   */
  static canReview(user: auth.SessionUser): boolean {
    return auth.isGestorLevel(user) || auth.isCoordLevel(user)
  }

  static isSysAdmin(user: auth.SessionUser): boolean {
    return auth.isSysAdmin(user)
  }

  static isMasterManager(user: auth.SessionUser): boolean {
    return auth.isDiretoriaLevel(user)
  }
}
