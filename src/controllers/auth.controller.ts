import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import * as authService from '../services/auth.service'
import { registerBody } from '../schemas/auth.schema'

export const register = async (req: Request, res: Response) => {
  const input = registerBody.parse(req.body)
  const user = await authService.registerUser(input)
  res.status(StatusCodes.CREATED).json({ user })
}
