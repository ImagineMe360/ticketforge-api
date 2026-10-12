import db from '../db/connect'
import ConflictError from '../errors/conflict-error'
import { hashPassword } from '../lib/password'
import { RegisterInput } from '../schemas/auth.schema'

export const registerUser = async (input: RegisterInput) => {
  const passwordHash = await hashPassword(input.password)

  try {
    return await db.user.create({
      data: { email: input.email, name: input.name, passwordHash },
      omit: { passwordHash: true },
    })
  } catch (err) {
    // P2002 = unique constraint violation (the email already exists).
    if ((err as { code?: string }).code === 'P2002') {
      throw new ConflictError('An account with this email already exists')
    }
    throw err
  }
}
