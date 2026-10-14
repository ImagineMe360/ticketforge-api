import dotenv from 'dotenv'
import { bool, cleanEnv, makeValidator, num, port, str } from 'envalid'

dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

const secret = makeValidator<string>((v) => {
  if (v.length < 32) throw new Error('Must be at least 32 characters')
  return v
})

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
  JWT_ACCESS_SECRET: secret({ desc: 'secret used to sign access token' }),
  ACCESS_TOKEN_TTL_SECONDS: num({ default: 900 }),
  REFRESH_TOKEN_TTL_DAYS: num({ default: 30 }),
  COOKIE_SECURE: bool({
    default: isProd,
    desc: 'Send cookies over HTTPS only',
  }),
})

export const config = {
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  databaseUrl: env.DATABASE_URL,
  jwtAccessSecret: env.JWT_ACCESS_SECRET,
  accessTokenTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
  refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
  cookieSecure: env.COOKIE_SECURE,
}

export default config
