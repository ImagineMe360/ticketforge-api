import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import * as authService from '../services/auth.service'
import { loginBody, registerBody } from '../schemas/auth.schema'
import {
  clearRefreshCookieOptions,
  REFRESH_COOKIE,
  refreshCookieOptions,
} from '../lib/cookies'
import config from '../config'
import UnauthenticatedError from '../errors/unauthenticated-error'

export const register = async (req: Request, res: Response) => {
  const input = registerBody.parse(req.body)
  const user = await authService.registerUser(input)
  res.status(StatusCodes.CREATED).json({ user })
}

export const login = async (req: Request, res: Response) => {
  const input = loginBody.parse(req.body)
  const result = await authService.loginUser(input, {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  })

  res.cookie(
    REFRESH_COOKIE,
    result.refreshToken,
    refreshCookieOptions(result.refreshExpiresAt),
  )
  res.status(StatusCodes.OK).json({
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: config.accessTokenTtlSeconds,
  })
}

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE]
  if (typeof token !== 'string' || !token) {
    throw new UnauthenticatedError('Refresh token missing')
  }
  const result = await authService.rotateRefreshToken(token)

  res.cookie(
    REFRESH_COOKIE,
    result.refreshToken,
    refreshCookieOptions(result.refreshExpiresAt),
  )
  res.status(StatusCodes.OK).json({
    accessToken: result.accessToken,
    expiresIn: config.accessTokenTtlSeconds,
  })
}

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE]
  if (typeof token === 'string' && token) {
    await authService.revokeByRefreshToken(token)
  }
  res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions)
  res.status(StatusCodes.NO_CONTENT).send()
}

export const me = async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.auth!.userId)
  res.status(StatusCodes.OK).json({ user })
}
