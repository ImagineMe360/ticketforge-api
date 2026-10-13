import { pinoHttp } from 'pino-http'
import logger from '../lib/logger'
import { randomUUID } from 'node:crypto'
import type { Request } from 'express'

const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id']
    const id =
      typeof incoming === 'string' && incoming ? incoming : randomUUID()
    res.setHeader('x-request-id', id)
    return id
  },
  autoLogging: { ignore: (req) => req.url === '/health' },
  // Allowlist: log only these fields, nothing else.
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customProps: (req: Request) => ({
    userId: req.auth?.userId,
    sessionId: req.auth?.sessionId,
  }),
})

export default httpLogger
