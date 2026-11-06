import { Redis } from 'ioredis'
import config from '../config'
import logger from './logger'

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 1, // don't retry a command 20 times while Redis is down
  commandTimeout: 1000, // a command that takes over 1s is treated as failed
})

// Without an 'error' listener, a connection failure would crash the process.
redis.on('error', (err) => logger.error({ err: err.message }, 'Redis error'))
redis.on('ready', () => logger.info('Redis ready'))

export default redis
