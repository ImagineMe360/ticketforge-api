import { describe, it, expect } from 'vitest'
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from '../src/lib/tokens'

describe('access tokens', () => {
  it('round-trips the payload', async () => {
    const token = await signAccessToken({ sub: 'u1', role: 'BUYER', sid: 's1' })
    expect(await verifyAccessToken(token)).toEqual({
      sub: 'u1',
      role: 'BUYER',
      sid: 's1',
    })
  })

  it('rejects a tampered token', async () => {
    const token = await signAccessToken({ sub: 'u1', role: 'BUYER', sid: 's1' })
    const [h, , s] = token.split('.')
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'u1', role: 'ADMIN', sid: 's1' }),
    ).toString('base64url')
    await expect(
      verifyAccessToken(`${h}.${forgedPayload}.${s}`),
    ).rejects.toThrow()
  })
})

describe('refresh tokens', () => {
  it('are unique and hash deterministically', () => {
    const a = generateRefreshToken()
    const b = generateRefreshToken()
    expect(a).not.toBe(b)
    expect(hashRefreshToken(a)).toBe(hashRefreshToken(a))
    expect(hashRefreshToken(a)).toHaveLength(64)
    expect(hashRefreshToken(a)).not.toContain(a)
  })
})
