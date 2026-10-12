import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ZodError } from 'zod'
import CustomAPIError from '../errors/custom-error'

// interface CustomError extends Error {
//   statusCode?: number;
// }

const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestId = req.id

  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      errors: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
      requestId,
    })
  }

  if (err instanceof CustomAPIError) {
    return res
      .status(err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message, requestId })
  }

  // Unknown error: log everything, tell the client nothing sensitive.
  req.log.error({ err }, 'Unhandled error')
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: 'Something went wrong', requestId })
}

export default errorHandlerMiddleware
