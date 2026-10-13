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

const authRoutes = express.Router()

authRoutes.post('/register', register)
authRoutes.post('/login', login)
authRoutes.post('/refresh', refresh)
authRoutes.post('/logout', logout)
authRoutes.get('/me', authenticate, me)
authRoutes.get('/sessions', authenticate, listSessions)
authRoutes.delete('/sessions/:id', authenticate, revokeSession)
authRoutes.post('/logout-all', authenticate, logoutAll)

export default authRoutes
