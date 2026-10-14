import type { CookieOptions } from 'express'
import config from '../config'

export const REFRESH_COOKIE = 'refresh_token'

// clearCookie only works if path and attributes match how it was set.
export const clearRefreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  path: '/api/v1/auth',
}

export const refreshCookieOptions = (expires: Date): CookieOptions => ({
  ...clearRefreshCookieOptions,
  expires,
})
