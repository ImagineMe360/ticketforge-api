import { NextFunction, Request, Response } from 'express'
import UnauthenticatedError from '../errors/unauthenticated-error'
import { verifyAccessToken } from '../lib/tokens'
import db from '../db/connect'
import { Role } from '../generated/prisma/enums'

const TOUCH_INTERVAL_MS = 60_000

const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.get('authorization')
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication required')
  }

  let payload
  try {
    payload = await verifyAccessToken(header.slice(7))
  } catch {
    throw new UnauthenticatedError('Invalid or expired token')
  }

  const session = await db.session.findUnique({ where: { id: payload.sid } })
  if (
    !session ||
    session.userId !== payload.sub ||
    session.revokedAt ||
    session.expiresAt <= new Date()
  ) {
    throw new UnauthenticatedError('Session is no longer active')
  }

  // Record activity, but at most once a minute: writing on every request would be wasteful.
  if (Date.now() - session.lastActiveAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    })
  }

  req.auth = {
    userId: payload.sub,
    role: payload.role as Role,
    sessionId: session.id,
  }
  next()
}

export default authenticate
