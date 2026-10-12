import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../src/lib/password'

describe('password hashing', () => {
  it('produces an argon2id hash, never the plain text', async () => {
    const hash = await hashPassword('correct horse battery')
    expect(hash.startsWith('$argon2id$')).toBe(true)
    expect(hash).not.toContain('correct horse')
  })

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery')
    expect(await verifyPassword(hash, 'correct horse battery')).toBe(true)
    expect(await verifyPassword(hash, 'wrong password')).toBe(false)
  })

  it('salts: same password gives different hashes', async () => {
    const a = await hashPassword('same-password')
    const b = await hashPassword('same-password')
    expect(a).not.toBe(b)
  })

  it('treats a malformed hash as a non-match', async () => {
    expect(await verifyPassword('not-a-real-hash', 'anything')).toBe(false)
  })
})
