import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import * as authService from '../services/auth.service'
import { loginBody, registerBody } from '../schemas/auth.schema'
import { REFRESH_COOKIE, refreshCookieOptions } from '../lib/cookies'
import config from '../config'

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
