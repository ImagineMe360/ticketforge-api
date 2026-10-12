import dotenv from 'dotenv'
import { cleanEnv, port, str } from 'envalid'

dotenv.config()

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  LOG_LEVEL: str({
    choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
    default: 'info',
  }),
  PORT: port({ default: 5000 }),
  CORS_ORIGIN: str({ default: '*', desc: 'Allowed CORS origin(s)' }),
  DATABASE_URL: str({ desc: 'Database connection URL' }),
})

export const config = {
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  databaseUrl: env.DATABASE_URL,
}

export default config
