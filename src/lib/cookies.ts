import { CookieOptions } from 'express'
import config from '../config'

export const REFRESH_COOKIE = 'refresh_token'

export const refreshCookieOptions = (expires: Date): CookieOptions => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax',
  path: 'api/v1/auth',
  expires,
})
