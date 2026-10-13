import express from 'express'
import { getUsers } from '../controllers/users.controller'
import authenticate from '../middleware/authenticate'
import requireRole from '../middleware/require-role'
import { Role } from '../generated/prisma/enums'

const userRoutes = express.Router()

userRoutes.get('/', authenticate, requireRole(Role.ADMIN), getUsers)

export default userRoutes
