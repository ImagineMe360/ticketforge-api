import argon2, { HashOptions } from 'argon2'

// OWASP-recommended minimum settings for argon2id.
const options: HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456, // KiB, about 19 MiB
  timeCost: 2,
  parallelism: 1,
}

export const hashPassword = (plain: string): Promise<string> =>
  argon2.hash(plain, options)

export const verifyPassword = async (
  hash: string,
  plain: string,
): Promise<boolean> => {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    // A malformed hash (e.g. our seed user's placeholder) means "no match", not a crash.
    return false
  }
}
