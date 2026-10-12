import pino from 'pino'
import config from '../config'

export const logger = pino({
  level: config.nodeEnv === 'test' ? 'silent' : config.logLevel,
  redact: ['req.headers.authorization', 'req.headers.cookies'],
  transport:
    config.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

export default logger
