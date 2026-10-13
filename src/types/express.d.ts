import { Role } from '../generated/prisma/enums'

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role; sessionId: string }
    }
  }
}

export {}
