import config from '../config'
import db from '../db/connect'
import ConflictError from '../errors/conflict-error'
import UnauthenticatedError from '../errors/unauthenticated-error'
import logger from '../lib/logger'
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

export const rotateRefreshToken = async (presented: string) => {
  const presentedHash = hashRefreshToken(presented)

  const session = await db.session.findUnique({
    where: { refreshTokenHash: presentedHash },
    include: { user: true },
  })

  if (!session) {
    // Not current. Is it an already-rotated token being replayed?
    const reused = await db.session.findUnique({
      where: { previousRefreshTokenHash: presentedHash },
    })
    if (reused && !reused.revokedAt) {
      await db.session.update({
        where: { id: reused.id },
        data: { revokedAt: new Date() },
      })
      logger.warn(
        { sessionId: reused.id, userId: reused.userId },
        'Refresh token reuse detected; session revoked',
      )
    }
    throw new UnauthenticatedError('Invalid refresh token')
  }

  if (session.revokedAt || session.expiresAt <= new Date()) {
    throw new UnauthenticatedError('Invalid refresh token')
  }

  const newRefreshToken = generateRefreshToken()

  // Compare-and-swap: only one of any concurrent requests can win.
  const swapped = await db.session.updateMany({
    where: { id: session.id, refreshTokenHash: presentedHash, revokedAt: null },
    data: {
      refreshTokenHash: hashRefreshToken(newRefreshToken),
      previousRefreshTokenHash: presentedHash,
      lastActiveAt: new Date(),
    },
  })
  if (swapped.count !== 1)
    throw new UnauthenticatedError('Invalid refresh token')

  const accessToken = await signAccessToken({
    sub: session.userId,
    role: session.user.role, // role is re-read from the database on every refresh
    sid: session.id,
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
    refreshExpiresAt: session.expiresAt, // absolute 30-day lifetime from login
  }
}

export const revokeByRefreshToken = async (token: string) => {
  // updateMany makes this idempotent: logging out twice is harmless.
  await db.session.updateMany({
    where: { refreshTokenHash: hashRefreshToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export const getCurrentUser = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    omit: { passwordHash: true },
  })
  if (!user) throw new UnauthenticatedError('Authentication required')
  return user
}
