import rateLimit from 'express-rate-limit'
import RedisStore, { type RedisReply } from 'rate-limit-redis'
import redis from '../lib/redis'

interface LimiterOptions {
  prefix: string
  windowMs: number
  limit: number
  skipSuccessfulRequests?: boolean
}

export const createLimiter = (opts: LimiterOptions) =>
  rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true, // fail open if Redis is unavailable
    store: new RedisStore({
      prefix: `rl:${opts.prefix}:`,
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<RedisReply>,
    }),
    handler: (req, res) => {
      res.status(429).json({ message: 'Too many requests', requestId: req.id })
    },
  })
