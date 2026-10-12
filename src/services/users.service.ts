import db from '../db/connect';

export const getUsers = async () => {
  const users = await db.user.findMany({});
  return users;
};
