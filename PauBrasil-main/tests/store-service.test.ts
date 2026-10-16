import assert from 'node:assert/strict'
import { describe, it, beforeEach, mock } from 'node:test'
import { StoreService } from '../src/services/StoreService'

describe('StoreService - World-Class Unit Suite', () => {
  let mockDb: any
  let service: StoreService

  beforeEach(() => {
    mockDb = {
      rewardProduct: {
        findUnique: mock.fn(),
        update: mock.fn(),
      },
      pointsLedger: {
        aggregate: mock.fn(),
        create: mock.fn(),
      },
      redemptionOrder: {
        create: mock.fn(),
      },
      $transaction: mock.fn(async (arg: any) => {
        if (Array.isArray(arg)) return Promise.all(arg)
        return arg(mockDb)
      }),
    }
    service = new StoreService(mockDb)
  })

  describe('redeemProduct()', () => {
    it('rejeita resgate se o produto nao for encontrado ou estiver inativo', async () => {
      mockDb.rewardProduct.findUnique.mock.mockImplementationOnce(async () => null)

      await assert.rejects(
        service.redeemProduct('user1', 'prod_invalido', 'User Name'),
        /Produto indisponivel/
      )
    })

    it('rejeita resgate se o produto estiver com estoque zerado', async () => {
      mockDb.rewardProduct.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'prod1',
        name: 'Mochila Exclusiva',
        pointsCost: 500,
        stock: 0,
        active: true,
      }))

      await assert.rejects(
        service.redeemProduct('user1', 'prod1', 'User Name'),
        /Produto sem estoque/
      )
    })

    it('rejeita resgate se o usuario nao tiver saldo suficiente', async () => {
      mockDb.rewardProduct.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'prod1',
        name: 'Mochila Exclusiva',
        pointsCost: 500,
        stock: 10,
        active: true,
      }))
      mockDb.pointsLedger.aggregate.mock.mockImplementationOnce(async () => ({
        _sum: { points: 300 },
      }))

      await assert.rejects(
        service.redeemProduct('user1', 'prod1', 'User Name'),
        /Saldo insuficiente/
      )
    })

    it('processa o resgate com sucesso de forma atomica', async () => {
      mockDb.rewardProduct.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'prod1',
        name: 'Mochila Exclusiva',
        pointsCost: 500,
        stock: 10,
        active: true,
      }))
      mockDb.pointsLedger.aggregate.mock.mockImplementationOnce(async () => ({
        _sum: { points: 1500 },
      }))
      mockDb.redemptionOrder.create.mock.mockImplementationOnce(async () => ({
        id: 'order1',
        userId: 'user1',
        productId: 'prod1',
        pointsCost: 500,
        status: 'REQUESTED',
      }))

      const result = await service.redeemProduct('user1', 'prod1', 'User Name')

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.id, 'order1')
      assert.strictEqual(mockDb.$transaction.mock.calls.length, 1)

      const ledgerCall = mockDb.pointsLedger.create.mock.calls[0].arguments[0]
      assert.strictEqual(ledgerCall.data.kind, 'REDEEM')
      assert.strictEqual(ledgerCall.data.points, -500)
      assert.strictEqual(ledgerCall.data.status, 'CONFIRMED')

      const productUpdateCall = mockDb.rewardProduct.update.mock.calls[0].arguments[0]
      assert.strictEqual(productUpdateCall.data.stock.decrement, 1)

      const orderCall = mockDb.redemptionOrder.create.mock.calls[0].arguments[0]
      assert.strictEqual(orderCall.data.status, 'REQUESTED')
      assert.strictEqual(orderCall.data.pointsCost, 500)
    })

    it('impede resgates com custo zero ou negativo', async () => {
      mockDb.rewardProduct.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'prod_bugado',
        name: 'Item Injetado',
        pointsCost: 0,
        stock: 10,
        active: true,
      }))
      mockDb.pointsLedger.aggregate.mock.mockImplementationOnce(async () => ({
        _sum: { points: 100 },
      }))

      await assert.rejects(
        service.redeemProduct('user1', 'prod_bugado', 'User Name'),
        /Valor de produto invalido/
      )
    })
  })
})
