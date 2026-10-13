import { StatusCodes } from 'http-status-codes'
import CustomAPIError from './custom-error'

class ForbiddenError extends CustomAPIError {
  constructor(message: string) {
    super(message)
    this.statusCode = StatusCodes.FORBIDDEN
  }
}

export default ForbiddenError
