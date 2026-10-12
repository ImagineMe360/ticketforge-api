import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../src/server'

describe('GET /api/v1/events validation', () => {
  it('rejects an out-of-range limit', async () => {
    const res = await request(app).get('/api/v1/events?limit=1000')
    expect(res.status).toBe(400)
    expect(res.body.errors[0].path).toBe('limit')
    expect(res.body.requestId).toBeDefined()
  })

  it('rejects a non-uuid id', async () => {
    const res = await request(app).get('/api/v1/events/not-a-uuid')
    expect(res.status).toBe(400)
  })
})
