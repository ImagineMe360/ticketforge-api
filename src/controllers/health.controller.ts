import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import db from '../db/connect'
import redis from '../lib/redis'

export const getHealth = (_req: Request, res: Response): void => {
  res.status(StatusCodes.OK).json({ status: 'ok', uptime: process.uptime() })
}

export const getReady = async (_req: Request, res: Response): Promise<void> => {
  const checks = { database: false, redis: false }
  try {
    await db.$queryRaw`SELECT 1`
    checks.database = true
  } catch {
    /* stays false */
  }
  try {
    checks.redis = (await redis.ping()) === 'PONG'
  } catch {
    /* stays false */
  }
  const ready = checks.database && checks.redis
  res
    .status(ready ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE)
    .json({ status: ready ? 'ready' : 'degraded', checks })
}
