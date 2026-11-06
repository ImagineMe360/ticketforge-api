import { Application } from 'express'
import helmet from 'helmet'
import { createLimiter } from './rate-limit'
import config from '../config'

const securityMiddleware = (app: Application): void => {
  app.use(helmet())
  app.use(
    createLimiter({
      prefix: 'global',
      windowMs: 15 * 60 * 100,
      limit: config.rateLimitMax,
    }),
  )
}

export default securityMiddleware
