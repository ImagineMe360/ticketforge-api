import express from 'express'
import { Server } from 'http'
import 'express-async-errors'
import cors from 'cors'
import config from './config/index'
import securityMiddleware from './middleware/security'

import db from './db/connect'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import NotFound from './middleware/not-found'
import errorHandlerMiddleware from './middleware/error-handler'
import healthRoutes from './routes/health.routes'
import userRoutes from './routes/users.routes'
import httpLogger from './middleware/http-logger'
import logger from './lib/logger'
import eventRoutes from './routes/events.routes'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const openApiPath = fs.existsSync(path.join(__dirname, 'docs/openapi.yaml'))
  ? path.join(__dirname, 'docs/openapi.yaml')
  : path.join(__dirname, '../src/docs/openapi.yaml')
const swaggerDocument = YAML.load(openApiPath)

const app = express()

securityMiddleware(app)
const corsOptions = {
  origin:
    config.corsOrigin === '*'
      ? '*'
      : config.corsOrigin.split(',').map((o) => o.trim()),
}
app.use(cors(corsOptions))
app.use(httpLogger)
app.use(express.json())

// swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.get('/', (_req, res) => {
  res.send('Hello, World!')
})

// routes middleware
app.use('/health', healthRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/events', eventRoutes)

// error middleware
app.use(NotFound)
app.use(errorHandlerMiddleware)

const port = config.port

let server: Server
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(port, async () => {
    logger.info(`server listening on port ${port}...`)
  })

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`)
    server.close(async () => {
      logger.info('HTTP server closed.')

      try {
        await db.$disconnect()
        logger.info('Prisma client disconnected.')
      } catch {
        logger.error('Error disconnecting Prisma client:')
      }

      process.exit(0)
    })

    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.')
      process.exit(1)
    }, 10000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

export default app
