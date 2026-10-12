import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import config from '../config/index';

const connectionString = config.databaseUrl;

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

export default db;
