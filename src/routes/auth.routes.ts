import express from 'express'
import {
  login,
  logout,
  me,
  refresh,
  register,
} from '../controllers/auth.controller'
import authenticate from '../middleware/authenticate'

const authRoutes = express.Router()

authRoutes.post('/register', register)
authRoutes.post('/login', login)
authRoutes.post('/refresh', refresh)
authRoutes.post('/logout', logout)
authRoutes.get('/me', authenticate, me)

export default authRoutes
