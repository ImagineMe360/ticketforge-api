import { StatusCodes } from 'http-status-codes'
import CustomAPIError from './custom-error'

class ConflictError extends CustomAPIError {
  constructor(message: string) {
    super(message)
    this.statusCode = StatusCodes.CONFLICT
  }
}

export default ConflictError
