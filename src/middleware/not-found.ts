import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

const NotFound = (req: Request, res: Response) =>
  res.status(StatusCodes.NOT_FOUND).json({
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    requestId: req.id,
  })

export default NotFound
