import config from '../config'
import db from '../db/connect'
import ConflictError from '../errors/conflict-error'
import UnauthenticatedError from '../errors/unauthenticated-error'
import { hashPassword, verifyPassword } from '../lib/password'
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from '../lib/tokens'
import { LoginInput, RegisterInput } from '../schemas/auth.schema'

// Computed once, lazily. Used to burn the same CPU time when the email is unknown.
let dummyHash: Promise<string> | undefined
const getDummyHash = () =>
  (dummyHash ??= hashPassword('dummy-password-for-timing'))

export interface LoginMeta {
  userAgent?: string
  ipAddress?: string
}

export const registerUser = async (input: RegisterInput) => {
  const passwordHash = await hashPassword(input.password)

  try {
    return await db.user.create({
      data: { email: input.email, name: input.name, passwordHash },
      omit: { passwordHash: true },
    })
  } catch (err) {
    // P2002 = unique constraint violation (the email already exists).
    if ((err as { code?: string }).code === 'P2002') {
      throw new ConflictError('An account with this email already exists')
    }
    throw err
  }
}

export const loginUser = async (input: LoginInput, meta: LoginMeta) => {
  const user = await db.user.findUnique({ where: { email: input.email } })

  const hash = user?.passwordHash ?? (await getDummyHash())
  const passwordOk = await verifyPassword(hash, input.password)

  // One generic message for both "no such user" and "wrong password".
  if (!user || !passwordOk) {
    throw new UnauthenticatedError('Invalid email or password')
  }

  const refreshToken = generateRefreshToken()
  const refreshExpiresAt = new Date(
    Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  )

  const session = await db.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      userAgent: meta.userAgent?.slice(0, 255),
      ipAddress: meta.ipAddress,
      expiresAt: refreshExpiresAt,
    },
  })

  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    sid: session.id,
  })

  const { passwordHash: _passwordHash, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken, refreshExpiresAt }
}
