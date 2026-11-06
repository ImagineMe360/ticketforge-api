import { afterAll, describe, expect, it } from 'vitest'
import express from 'express'
import request from 'supertest'
import { createLimiter } from '../src/middleware/rate-limit'
import redis from '../src/lib/redis'

const makeApp = (prefix: string, limit = 3) => {
  const app = express()
  app.use(createLimiter({ prefix, windowMs: 60_000, limit }))
  app.get('/ping', (_req, res) => res.send('pong'))
  return app
}

afterAll(async () => {
  await redis.quit()
})

describe('redis-backed rate limiter', () => {
  it('blocks requests over the limit', async () => {
    const app = makeApp(`single-${Date.now()}`)
    const statuses: number[] = []
    for (let i = 0; i < 5; i++) {
      statuses.push((await request(app).get('/ping')).status)
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429])
  })

  it('shares one counter across separate app instances (replicas)', async () => {
    const prefix = `shared-${Date.now()}`
    const replicaA = makeApp(prefix)
    const replicaB = makeApp(prefix)

    const statuses: number[] = []
    for (const app of [replicaA, replicaB, replicaA, replicaB, replicaA]) {
      statuses.push((await request(app).get('/ping')).status)
    }
    // With in-memory counters this would be [200, 200, 200, 200, 200].
    expect(statuses).toEqual([200, 200, 200, 429, 429])
  })
})
