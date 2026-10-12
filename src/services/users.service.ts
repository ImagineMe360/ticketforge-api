import db from '../db/connect'

export const getUsers = async () => {
  return db.user.findMany({ omit: { passwordHash: true } })
}
