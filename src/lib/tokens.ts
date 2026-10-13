import { jwtVerify, SignJWT } from 'jose'
import config from '../config'
import { createHash, randomBytes } from 'node:crypto'

const key = new TextEncoder().encode(config.jwtAccessSecret)

export interface AccessTokenPayload {
  sub: string // user id
  role: string
  sid: string // session id
}

export const signAccessToken = (p: AccessTokenPayload): Promise<string> =>
  new SignJWT({ role: p.role, sid: p.sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${config.accessTokenTtlSeconds}s`)
    .sign(key)

export const verifyAccessToken = async (
  token: string,
): Promise<AccessTokenPayload> => {
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
  return {
    sub: payload.sub as string,
    role: payload.role as string,
    sid: payload.sid as string,
  }
}

// 32 random bytes = 256 bits of entropy. Unguessable.
export const generateRefreshToken = (): string =>
  randomBytes(32).toString('base64url')

// Fast hash is fine here: the input is already high-entropy.
export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')
