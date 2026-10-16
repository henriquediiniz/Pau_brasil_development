import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { canManageTeam, isCoordLevel, isSysAdmin, SessionUser } from '@/lib/auth-helpers'

export class TaskService {
  constructor(private db = prisma) {}

  /**
   * Revisa uma tarefa (aprova ou reprova), processando pontos, 
   * auditoria, notificações e validação de hierarquia.
   */
  async reviewTask(
    instanceId: string,
    approver: SessionUser,
    action: 'approve' | 'reject',
    options: { note?: string; approvedPoints?: number } = {}
  ) {
    const { note, approvedPoints } = options

    if (!canManageTeam(approver)) {
      throw new Error('Permissão insuficiente para gerenciar a equipe')
    }

    const instance = await this.db.taskInstance.findUnique({
      where: { id: instanceId },
      include: {
        taskDefinition: { select: { title: true, points: true } },
        user: { select: { id: true, name: true, managerId: true } },
      },
    })

    if (!instance || instance.status !== 'DONE') {
      throw new Error('Tarefa não encontrada ou não está pendente de revisão')
    }

    // ── Validação de Hierarquia ──
    if (!isSysAdmin(approver)) {
      await this.validateHierarchy(approver, instance.user)
    }

    const taskTitle = instance.isAdHoc
      ? (instance.adHocTitle ?? 'Atividade avulsa')
      : (instance.taskDefinition?.title ?? 'Tarefa')

    if (action === 'approve') {
      return await this.handleApproval(instance, approver, taskTitle, approvedPoints)
    } else {
      return await this.handleRejection(instance, approver, taskTitle, note)
    }
  }

  /**
   * Garante que o aprovador tenha autoridade sobre o colaborador.
   */
  private async validateHierarchy(approver: SessionUser, collaborator: { id: string; managerId: string | null }) {
    if (isCoordLevel(approver)) {
      // Coordenador só aprova seus diretos
      if (collaborator.managerId !== approver.id) {
        throw new Error('Sem permissão para aprovar esta tarefa (fora da sua hierarquia direta)')
      }
    } else {
      // Gestor (Gerente/Diretor) aprova diretos e indiretos (N+2)
      const directSubs = await this.db.user.findMany({
        where: { managerId: approver.id },
        select: { id: true },
      })
      const directIds = directSubs.map(s => s.id)
      
      const indirectSubs = await this.db.user.findMany({
        where: { managerId: { in: directIds } },
        select: { id: true },
      })
      
      const allowedIds = new Set([...directIds, ...indirectSubs.map(s => s.id)])
      if (!allowedIds.has(collaborator.id)) {
        throw new Error('Sem permissão para aprovar esta tarefa (colaborador não pertence à sua árvore de gestão)')
      }
    }
  }

  private async handleApproval(
    instance: any,
    approver: SessionUser,
    taskTitle: string,
    approvedPoints?: number
  ) {
    const approverName = approver.name ?? 'Gestor'

    if (instance.isAdHoc) {
      const pts = typeof approvedPoints === 'number' ? approvedPoints : (instance.requestedPoints ?? 0)
      
      await this.db.$transaction([
        this.db.taskInstance.update({
          where: { id: instance.id, status: 'DONE' },
          data: { status: 'APPROVED', approvedBy: approver.id, approvedAt: new Date() },
        }),
        this.db.pointsLedger.create({
          data: {
            userId: instance.userId,
            kind: 'EARN',
            status: 'CONFIRMED',
            points: pts,
            refType: 'TaskInstance',
            refId: instance.id,
            note: `Atividade avulsa aprovada: ${taskTitle}`,
          },
        }),
      ])

      void notify(
        instance.user.id,
        pts > 0 ? `⭐ Pontuação atribuída!` : `✅ Atividade registrada`,
        pts > 0
          ? `"${taskTitle}" recebeu +${pts} pontos de ${approverName}.`
          : `"${taskTitle}" foi registrada por ${approverName} sem pontuação.`,
        undefined,
        '/app/pontos',
      )
    } else {
      await this.db.$transaction([
        this.db.taskInstance.update({
          where: { id: instance.id, status: 'DONE' },
          data: { status: 'APPROVED', approvedBy: approver.id, approvedAt: new Date() },
        }),
        this.db.pointsLedger.updateMany({
          where: { refType: 'TaskInstance', refId: instance.id, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        }),
      ])

      void notify(
        instance.user.id,
        `✅ Tarefa aprovada!`,
        `"${taskTitle}" foi aprovada por ${approverName}. +${instance.taskDefinition?.points ?? 0} pontos confirmados!`,
        undefined,
        '/app/pontos',
      )
    }

    await audit({
      actorId: approver.id,
      actorName: approverName,
      action: 'TASK_APPROVED',
      targetType: 'TaskInstance',
      targetId: instance.id,
      meta: { collaboratorId: instance.user.id, collaboratorName: instance.user.name, isAdHoc: instance.isAdHoc, approvedPoints },
    })

    return { success: true }
  }

  private async handleRejection(
    instance: any,
    approver: SessionUser,
    taskTitle: string,
    note?: string
  ) {
    const approverName = approver.name ?? 'Gestor'

    await this.db.$transaction([
      this.db.taskInstance.update({
        where: { id: instance.id, status: 'DONE' },
        data: { status: 'REJECTED', approvedBy: approver.id, approvedAt: new Date(), note: note || null },
      }),
      this.db.pointsLedger.deleteMany({
        where: { refType: 'TaskInstance', refId: instance.id, status: 'PENDING' },
      }),
    ])

    void notify(
      instance.user.id,
      instance.isAdHoc ? `❌ Atividade não contabilizada` : `❌ Tarefa reprovada`,
      instance.isAdHoc
        ? `"${taskTitle}" foi marcada como não realizada por ${approverName}${note ? `: ${note}` : '.'}`
        : `"${taskTitle}" foi reprovada${note ? `: ${note}` : '. Entre em contato com seu gestor.'}`,
      undefined,
      '/app/hoje',
    )

    void audit({
      actorId: approver.id,
      actorName: approverName,
      action: 'TASK_REJECTED',
      targetType: 'TaskInstance',
      targetId: instance.id,
      meta: { collaboratorId: instance.user.id, collaboratorName: instance.user.name, note, isAdHoc: instance.isAdHoc },
    })

    return { success: true }
  }

  /**
   * Completa uma tarefa (regular ou avulsa), processando pontos, 
   * auditoria, notificações e encadeamento.
   */
  async completeTask(
    instanceId: string,
    userId: string,
    userName: string,
    options: { note?: string; evidenceUrl?: string } = {}
  ) {
    const { note, evidenceUrl } = options

    const instance = await this.db.taskInstance.findUnique({
      where: { id: instanceId },
      include: {
        taskDefinition: {
          include: {
            nextTaskDefinition: {
              include: { function: { include: { users: { select: { id: true } } } } },
            },
          },
        },
      },
    })

    if (!instance || instance.userId !== userId) {
      throw new Error('Tarefa não encontrada')
    }

    if (instance.status === 'BLOCKED') {
      throw new Error('Esta tarefa está aguardando outra ser concluída primeiro')
    }
    if (instance.status !== 'PENDING') {
      throw new Error('Tarefa já processada')
    }

    // ── Atividade avulsa (AdHoc) ──
    if (instance.isAdHoc) {
      return await this.handleAdHocCompletion(instance, userId, userName, note, evidenceUrl)
    }

    // ── Tarefa regular ──
    if (!instance.taskDefinition) {
      throw new Error('Configuração de tarefa não encontrada')
    }

    return await this.handleRegularTaskCompletion(instance, userId, userName, note, evidenceUrl)
  }

  private async handleAdHocCompletion(
    instance: any,
    userId: string,
    userName: string,
    note?: string,
    evidenceUrl?: string
  ) {
    try {
      await this.db.taskInstance.update({
        where: { id: instance.id, status: 'PENDING' },
        data: { status: 'DONE', note: note || null, evidenceUrl: evidenceUrl || null },
      })
    } catch (err: any) {
      if (err.code === 'P2025') throw new Error('Tarefa já processada')
      throw err
    }

    const userWithManager = await this.db.user.findUnique({
      where: { id: userId },
      select: { managerId: true, name: true },
    })

    if (userWithManager?.managerId) {
      void notify(
        userWithManager.managerId,
        `Atividade avulsa para pontuar`,
        `${userWithManager.name ?? userName} concluiu "${instance.adHocTitle}" e aguarda a atribuição de pontos.`,
        undefined,
        '/app/aprovar',
      )
    }

    void audit({
      actorId: userId, actorName: userName,
      action: 'TASK_COMPLETED', targetType: 'TaskInstance', targetId: instance.id,
      meta: { isAdHoc: true, adHocTitle: instance.adHocTitle, requestedPoints: instance.requestedPoints },
    })

    return { success: true, isAdHoc: true, requiresApproval: false }
  }

  private async handleRegularTaskCompletion(
    instance: any,
    userId: string,
    userName: string,
    note?: string,
    evidenceUrl?: string
  ) {
    const taskDef = instance.taskDefinition

    // Detectar atraso (rolled-over)
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const instanceDate = new Date(instance.date); instanceDate.setHours(0, 0, 0, 0)
    const isLate = instanceDate < todayStart

    // Validação de limite diário
    const dayStart = new Date(instance.date); dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(instance.date); dayEnd.setHours(23, 59, 59, 999)

    const completedOnDate = await this.db.taskInstance.count({
      where: {
        userId,
        taskDefinitionId: instance.taskDefinitionId,
        date: { gte: dayStart, lte: dayEnd },
        status: { in: ['DONE', 'APPROVED'] },
      },
    })

    if (completedOnDate >= taskDef.dailyLimit) {
      throw new Error(`Limite diário de ${taskDef.dailyLimit} conclusão(ões) ATINGIDO`)
    }

    if (taskDef.requireEvidence && !evidenceUrl) {
      throw new Error('Evidência obrigatória para esta tarefa')
    }

    // Configuração de pontos e status
    const requiresApproval = isLate ? false : taskDef.requireApproval
    const newStatus    = requiresApproval ? 'DONE' : 'APPROVED'
    const ledgerStatus = requiresApproval ? 'PENDING' : 'CONFIRMED'
    const pointsToAward = isLate ? 0 : taskDef.points

    try {
      await this.db.$transaction(async (tx) => {
        await tx.taskInstance.update({
          where: { id: instance.id, status: 'PENDING' },
          data: {
            status: newStatus,
            note: note || null,
            evidenceUrl: evidenceUrl || null,
            approvedAt: requiresApproval ? null : new Date(),
          },
        })

        await tx.pointsLedger.create({
          data: {
            userId,
            kind: 'EARN',
            status: ledgerStatus,
            points: pointsToAward,
            refType: 'TaskInstance',
            refId: instance.id,
            note: isLate
              ? `Tarefa atrasada (0 pts): ${taskDef.title}`
              : `Tarefa: ${taskDef.title}`,
          },
        })
      })
    } catch (err: any) {
      if (err?.code === 'P2002' || err?.code === 'P2025') {
        throw new Error('Tarefa já processada')
      }
      throw err
    }

    void audit({
      actorId: userId, actorName: userName,
      action: 'TASK_COMPLETED', targetType: 'TaskInstance', targetId: instance.id,
      meta: { taskTitle: taskDef.title, points: pointsToAward, requiresApproval, isLate },
    })

    if (requiresApproval) {
      const userWithManager = await this.db.user.findUnique({
        where: { id: userId },
        select: { managerId: true, name: true },
      })
      if (userWithManager?.managerId) {
        void notify(
          userWithManager.managerId,
          `Nova tarefa para aprovar`,
          `${userWithManager.name} concluiu "${taskDef.title}" e aguarda sua aprovação.`,
          undefined,
          '/app/aprovar',
        )
      }
    }

    // Encadeamento (Unlocking next tasks)
    await this.handleTaskChaining(instance, userName)

    return { success: true, requiresApproval, isLate, pointsAwarded: pointsToAward }
  }

  private async handleTaskChaining(instance: any, userName: string) {
    const nextDef = instance.taskDefinition?.nextTaskDefinition
    if (!nextDef) return

    const dayStartUnblock = new Date(instance.date); dayStartUnblock.setHours(0, 0, 0, 0)
    const dayEndUnblock = new Date(instance.date); dayEndUnblock.setHours(23, 59, 59, 999)

    const targetUserIds = nextDef.function.users.map((u: { id: string }) => u.id)
    if (targetUserIds.length === 0) return

    // Desbloqueia instâncias BLOCKED existentes para hoje
    const updated = await this.db.taskInstance.updateMany({
      where: {
        userId: { in: targetUserIds },
        taskDefinitionId: nextDef.id,
        status: 'BLOCKED',
        date: { gte: dayStartUnblock, lte: dayEndUnblock },
      },
      data: { status: 'PENDING', triggeredByInstanceId: instance.id },
    })

    // Se não existia instância (usuário não acessou o checklist ainda), cria agora
    if (updated.count === 0) {
      await this.db.taskInstance.createMany({
        data: targetUserIds.map((uid: string) => ({
          userId: uid,
          taskDefinitionId: nextDef.id,
          date: dayStartUnblock,
          status: 'PENDING',
          triggeredByInstanceId: instance.id,
        })),
        skipDuplicates: true,
      })
      
      // Atualiza triggeredByInstanceId para as criadas
      await this.db.taskInstance.updateMany({
        where: {
          userId: { in: targetUserIds },
          taskDefinitionId: nextDef.id,
          date: { gte: dayStartUnblock, lte: dayEndUnblock },
          triggeredByInstanceId: null,
        },
        data: { triggeredByInstanceId: instance.id },
      })
    }

    // Notifica usuários da próxima função
    for (const uid of targetUserIds) {
      void notify(
        uid,
        `Nova tarefa disponível`,
        `"${nextDef.title}" foi desbloqueada por ${userName} — conclua hoje.`,
        undefined,
        '/app/hoje',
      )
    }
  }
}
