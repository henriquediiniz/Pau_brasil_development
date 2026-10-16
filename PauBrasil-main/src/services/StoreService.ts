import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { LedgerStatus } from '@prisma/client'

export class StoreService {
  constructor(private db = prisma) {}

  private resolveRedeemArgs(productOrUserName: string, userNameOrProduct: string) {
    const swappedArgs = /\s/.test(productOrUserName) && !/\s/.test(userNameOrProduct)

    return swappedArgs
      ? { productId: userNameOrProduct, userName: productOrUserName }
      : { productId: productOrUserName, userName: userNameOrProduct }
  }

  /**
   * Processa o resgate de um produto pela loja.
   * Valida saldo, estoque e realiza o debito de pontos de forma atomica.
   */
  async redeemProduct(userId: string, productOrUserName: string, userNameOrProduct: string) {
    const { productId, userName } = this.resolveRedeemArgs(productOrUserName, userNameOrProduct)

    const result = await this.db.$transaction(async (tx) => {
      const product = await tx.rewardProduct.findUnique({ where: { id: productId } })

      if (!product || !product.active) {
        throw Object.assign(new Error('Produto indisponivel'), { status: 404 })
      }

      if (product.stock !== null && product.stock <= 0) {
        throw Object.assign(new Error('Produto sem estoque'), { status: 400 })
      }

      if (product.pointsCost <= 0) {
        throw Object.assign(new Error('Valor de produto invalido'), { status: 400 })
      }

      const productTitle = product.title ?? (product as any).name ?? 'Produto'
      const ledger = await tx.pointsLedger.aggregate({
        where: { userId, status: LedgerStatus.CONFIRMED },
        _sum: { points: true },
      })
      const balance = ledger._sum.points ?? 0

      if (balance < product.pointsCost) {
        throw Object.assign(new Error('Saldo insuficiente'), { status: 400 })
      }

      const order = await tx.redemptionOrder.create({
        data: { userId, productId, pointsCost: product.pointsCost, status: 'REQUESTED' },
      })

      await tx.pointsLedger.create({
        data: {
          userId,
          kind: 'REDEEM',
          status: 'CONFIRMED',
          points: -product.pointsCost,
          refType: 'RedemptionOrder',
          refId: order.id,
          note: `Resgate: ${productTitle}`,
        },
      })

      if (product.stock !== null) {
        await tx.rewardProduct.update({
          where: { id: productId },
          data: { stock: { decrement: 1 } },
        })
      }

      return { order, product: { ...product, title: productTitle } }
    })

    void audit({
      actorId: userId,
      actorName: userName,
      action: 'REDEEM_REQUESTED',
      targetType: 'RedemptionOrder',
      targetId: result.order.id,
      meta: { productTitle: result.product.title, pointsCost: result.product.pointsCost },
    })

    return { ...result.order, success: true }
  }

  /**
   * Atualiza o status de um pedido de resgate (Gestao Administrativa).
   */
  async updateOrderStatus(
    orderId: string,
    action: 'approve' | 'deliver' | 'cancel',
    actorId: string,
    actorName: string
  ) {
    const order = await this.db.redemptionOrder.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true } },
        product: { select: { title: true } },
      },
    })

    if (!order) {
      throw Object.assign(new Error('Pedido nao encontrado'), { status: 404 })
    }

    const newStatus = action === 'approve' ? 'APPROVED' : action === 'deliver' ? 'DELIVERED' : 'CANCELED'

    await this.db.redemptionOrder.update({
      where: { id: orderId },
      data: { status: newStatus as any },
    })

    const notifMap: Record<string, { title: string; desc: string }> = {
      approve: {
        title: 'Resgate aprovado!',
        desc: `Seu pedido de "${order.product.title}" foi aprovado e sera entregue em breve.`,
      },
      deliver: {
        title: 'Resgate entregue!',
        desc: `Seu pedido de "${order.product.title}" foi marcado como entregue.`,
      },
      cancel: {
        title: 'Resgate cancelado',
        desc: `Seu pedido de "${order.product.title}" foi cancelado. Entre em contato com o RH.`,
      },
    }

    void notify(order.user.id, notifMap[action].title, notifMap[action].desc)

    void audit({
      actorId,
      actorName,
      action: `RESGATE_${newStatus}`,
      targetType: 'RedemptionOrder',
      targetId: orderId,
      meta: { userId: order.user.id, userName: order.user.name, product: order.product.title },
    })

    return { success: true }
  }
}
