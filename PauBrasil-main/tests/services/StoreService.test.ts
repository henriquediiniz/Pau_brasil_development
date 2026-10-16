import assert from 'node:assert/strict'
import test from 'node:test'
import { StoreService } from '../../src/services/StoreService'

const mockPrisma: any = {
  async $transaction(cb: any) { return cb(this) },
  rewardProduct: {
    findUnique: async () => ({ id: 'p1', title: 'Gift Card', pointsCost: 500, stock: 10, active: true }),
    update: async () => ({})
  },
  user: {
    findUnique: async () => ({ id: 'u1', points: 1000 })
  },
  pointsLedger: {
    create: async () => ({}),
    aggregate: async () => ({ _sum: { points: 1000 } })
  },
  redemptionOrder: {
    create: async () => ({ id: 'o1' })
  },
  audit: {
    create: async () => ({})
  }
}

test('StoreService: deve lançar erro se saldo for insuficiente', async () => {
  const localPrisma: any = {
    ...mockPrisma,
    pointsLedger: {
      aggregate: async () => ({ _sum: { points: 200 } }),
      create: async () => ({})
    }
  }
  
  const service = new StoreService(localPrisma)
  try {
    await service.redeemProduct('u1', 'p1', 'Test User')
    assert.fail('Deveria ter lançado erro de saldo')
  } catch (err: any) {
    assert.match(err.message, /Saldo insuficiente/)
  }
})

test('StoreService: deve lançar erro se estoque for zero', async () => {
  const localPrisma: any = {
    ...mockPrisma,
    rewardProduct: {
      findUnique: async () => ({ id: 'p1', title: 'Gift Card', pointsCost: 500, stock: 0, active: true }),
      update: async () => ({})
    }
  }
  
  const service = new StoreService(localPrisma)
  try {
    await service.redeemProduct('u1', 'p1', 'Test User')
    assert.fail('Deveria ter lançado erro de estoque')
  } catch (err: any) {
    assert.match(err.message, /Produto sem estoque/)
  }
})

test('StoreService: deve completar o resgate com sucesso e retornar o pedido', async () => {
  const service = new StoreService(mockPrisma)
  const order = await service.redeemProduct('u1', 'p1', 'Test User')
  
  assert.ok(order.id)
  assert.equal(order.id, 'o1')
})
