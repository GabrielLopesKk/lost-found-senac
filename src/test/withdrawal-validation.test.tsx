import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('@/app/lib/supabase', () => ({ supabase: { rpc: mocks.rpc }, PHOTO_BUCKET: 'item-photos' }))

import { validatePickupCode } from '@/app/data/api'

describe('withdrawal data validation', () => {
  beforeEach(() => vi.clearAllMocks())
  it('checks a pasted lowercase code without truncating it', async () => {
    const result = { itemRef: 'OBJ-TEST', itemName: 'Caderno', claimant: 'Test' }
    mocks.rpc.mockResolvedValue({ data: result, error: null })
    expect(await validatePickupCode('  k7qm-4xpa \n')).toEqual(result)
    expect(mocks.rpc).toHaveBeenCalledWith('validate_pickup_code', { p_code: 'K7QM4XPA' })
  })
  it.each(['', 'K7QM', 'K7QM-4XPAA', 'K7QM!4XPA'])('rejects malformed input %s before sending it', async (code) => {
    await expect(validatePickupCode(code)).rejects.toThrow()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it.each(['Este código expirou.', 'Este código já foi utilizado.', 'Código não encontrado.', 'Solicitação não aprovada.'])('propagates the database rejection: %s', async (message) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message } })
    await expect(validatePickupCode('K7QM-4XPA')).rejects.toThrow(message)
  })
  it('does not accept an empty success response', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null })
    await expect(validatePickupCode('K7QM-4XPA')).rejects.toThrow()
  })
})