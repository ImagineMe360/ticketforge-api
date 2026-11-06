import express from 'express'
import {
  listSessions,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
  revokeSession,
} from '../controllers/auth.controller'
import authenticate from '../middleware/authenticate'
import { createLimiter } from '../middleware/rate-limit'
import config from '../config'

const authRoutes = express.Router()

const loginLimiter = createLimiter({
  prefix: 'login',
  windowMs: 15 * 50 * 1000,
  limit: config.loginRateLimitMax,
  skipSuccessfulRequests: true,
})

authRoutes.post('/register', register)
authRoutes.post('/login', loginLimiter, login)
authRoutes.post('/refresh', refresh)
authRoutes.post('/logout', logout)
authRoutes.get('/me', authenticate, me)
authRoutes.get('/sessions', authenticate, listSessions)
authRoutes.delete('/sessions/:id', authenticate, revokeSession)
authRoutes.post('/logout-all', authenticate, logoutAll)

export default authRoutes
