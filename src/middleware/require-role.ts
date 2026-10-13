import { NextFunction, Request, Response } from 'express'
import ForbiddenError from '../errors/forbidden-error'
import UnauthenticatedError from '../errors/unauthenticated-error'
import type { Role } from '../generated/prisma/client.js'

const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new UnauthenticatedError('Authentication required')
    if (!roles.includes(req.auth.role)) {
      throw new ForbiddenError(
        'You do not have permission to perform this action',
      )
    }
    next()
  }

export default requireRole
