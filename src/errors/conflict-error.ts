import { StatusCodes } from 'http-status-codes'
import CustomAPIError from './custom-error.js'

class ConflictError extends CustomAPIError {
  constructor(message: string) {
    super(message)
    this.statusCode = StatusCodes.CONFLICT
  }
}

export default ConflictError
